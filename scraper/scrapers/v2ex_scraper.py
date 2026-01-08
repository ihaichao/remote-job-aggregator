import httpx
from typing import List, Dict
import os

class V2EXScraper:
    """V2EX Scraper using official API v2"""

    API_BASE = "https://www.v2ex.com/api/v2"

    # Nodes to scrape - remote is the dedicated remote work section
    NODES = ["remote", "jobs"]

    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }

    # Keywords to filter remote jobs from the general jobs node
    REMOTE_KEYWORDS = ['远程', 'remote', 'Remote', 'REMOTE', '在家', 'WFH', 'work from home', '居家']

    def __init__(self, token: str = None):
        self.token = token or os.getenv('V2EX_TOKEN')
        if self.token:
            self.HEADERS['Authorization'] = f'Bearer {self.token}'

    async def scrape(self) -> List[Dict]:
        """Scrape V2EX nodes for remote job positions"""
        all_jobs = []

        async with httpx.AsyncClient(headers=self.HEADERS, timeout=30.0) as client:
            for node in self.NODES:
                try:
                    jobs = await self._scrape_node(client, node)
                    all_jobs.extend(jobs)
                except Exception as e:
                    print(f"Error scraping V2EX node '{node}': {e}")

        # Deduplicate by topic ID
        seen_ids = set()
        unique_jobs = []
        for job in all_jobs:
            if job['source_id'] not in seen_ids:
                seen_ids.add(job['source_id'])
                unique_jobs.append(job)

        return unique_jobs

    async def _scrape_node(self, client: httpx.AsyncClient, node: str) -> List[Dict]:
        """Scrape a specific V2EX node"""
        jobs = []

        # Use API if token is available
        if self.token:
            jobs = await self._scrape_via_api(client, node)
        else:
            jobs = await self._scrape_via_html(client, node)

        return jobs

    async def _scrape_via_api(self, client: httpx.AsyncClient, node: str) -> List[Dict]:
        """Scrape using V2EX API v2 (requires token)"""
        jobs = []

        url = f"{self.API_BASE}/nodes/{node}/topics"
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()

        if not data.get('success'):
            print(f"V2EX API error: {data.get('message')}")
            return jobs

        for topic in data.get('result', []):
            title = topic.get('title', '')

            # Skip internship jobs
            if any(kw in title.lower() for kw in ['实习', 'intern', 'internship']):
                continue

            # For 'jobs' node, filter for remote keywords
            # For 'remote' node, all jobs are remote by definition
            if node == 'jobs' and not any(kw in title for kw in self.REMOTE_KEYWORDS):
                continue

            # Skip jobs not related to software development
            content = topic.get('content', '')
            full_text = title + ' ' + content
            if not self._is_dev_related(full_text):
                continue

            job = {
                'source_id': str(topic['id']),
                'title': title,
                'company': self._extract_company(title, content),
                'category': self._extract_category(title, content),
                'region_limit': self._extract_region(full_text),
                'work_type': self._extract_work_type(full_text),
                'source_site': 'v2ex',
                'original_url': topic.get('url', f"https://www.v2ex.com/t/{topic['id']}"),
                'description': content,
                'date_posted': self._timestamp_to_iso(topic.get('created')),
            }
            jobs.append(job)

        return jobs

    async def _scrape_via_html(self, client: httpx.AsyncClient, node: str) -> List[Dict]:
        """Fallback: Scrape via HTML parsing (no token required)"""
        from bs4 import BeautifulSoup
        jobs = []

        url = f"https://www.v2ex.com/go/{node}"
        response = await client.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        for cell in soup.select('#TopicsNode .cell'):
            title_elem = cell.select_one('a.topic-link')
            if not title_elem:
                continue

            title = title_elem.text.strip()

            # Skip internship jobs
            if any(kw in title.lower() for kw in ['实习', 'intern', 'internship']):
                continue

            # For 'jobs' node, filter for remote keywords
            if node == 'jobs' and not any(kw in title for kw in self.REMOTE_KEYWORDS):
                continue

            # Skip jobs not related to software development
            if not self._is_dev_related(title):
                continue

            author_elem = cell.select_one('strong a')
            company = author_elem.text.strip() if author_elem else 'Unknown'

            href = title_elem.get('href', '')
            topic_id = href.split('/t/')[-1].split('#')[0] if '/t/' in href else ''

            job = {
                'source_id': topic_id,
                'title': title,
                'company': company,
                'category': self._extract_category(title),
                'region_limit': self._extract_region(title),
                'work_type': self._extract_work_type(title),
                'source_site': 'v2ex',
                'original_url': f"https://www.v2ex.com{href}" if href.startswith('/') else href,
                'description': '',
            }
            jobs.append(job)

        return jobs

    def _extract_company(self, title: str, content: str) -> str:
        """Try to extract company name from title or content"""
        # Common patterns in V2EX job posts
        import re

        # Pattern: [Company] or 【Company】
        patterns = [
            r'[\[【]([^\]】]+)[\]】]',
            r'@\s*([A-Za-z0-9\u4e00-\u9fff]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, title)
            if match:
                return match.group(1).strip()

        return 'Unknown'

    def _extract_category(self, title: str, description: str = '') -> str:
        """Extract job category from title and description.
        Title has higher priority than description.
        More specific categories (mobile, blockchain) are checked first.
        """
        import re
        title_lower = title.lower()
        desc_lower = description.lower()
        
        # Order matters: core roles first, then modifiers
        # Keywords prefixed with \b need word boundary matching
        keywords = {
            # Core development roles (check first)
            'frontend': ['前端', 'frontend', 'web前端'],
            'backend': ['后端', 'backend', '服务端', 'server'],
            'fullstack': ['全栈', 'fullstack', 'full-stack', 'full stack'],
            'mobile': ['移动开发', r'\bios开发', r'\bandroid开发', 'flutter', 'react native', 'app开发'],
            # Specialized roles
            'security': ['安全', 'security', '渗透', 'penetration', 'red team', '攻防', 'infosec', '漏洞', 'vulnerability'],
            'design': ['ux', 'ui', '设计师', 'designer', 'figma', 'sketch', '交互设计', '视觉设计'],
            'quant': ['量化', 'quantitative', '风控开发', 'trading'],
            'devops': ['devops', r'\bsre\b', '运维', 'kubernetes', r'\bk8s\b', 'docker', '云原生'],
            # Tech stack modifiers (check last, only if no core role found)
            'blockchain': ['blockchain', '区块链', 'web3', 'solidity', 'smart contract'],
            'ai': ['machine learning', '机器学习', '人工智能', 'data scientist', r'\bnlp\b', '算法工程师', 'deep learning', 'pytorch', 'tensorflow'],
        }

        def match_keywords(text: str, terms: list) -> bool:
            for term in terms:
                if term.startswith(r'\b'):
                    # Use regex for word boundary matching
                    if re.search(term, text):
                        return True
                else:
                    # Simple substring matching
                    if term in text:
                        return True
            return False

        # Check title first (higher priority)
        for category, terms in keywords.items():
            if match_keywords(title_lower, terms):
                return category

        # Then check description
        for category, terms in keywords.items():
            if match_keywords(desc_lower, terms):
                return category

        return 'unknown'

    def _is_dev_related(self, text: str) -> bool:
        """Check if job is related to software development"""
        text_lower = text.lower()
        
        # Software development related keywords
        dev_keywords = [
            # Languages
            'python', 'java', 'javascript', 'typescript', 'go', 'golang', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
            # Frontend
            '前端', 'frontend', 'react', 'vue', 'angular', 'css', 'html', 'web',
            # Backend
            '后端', 'backend', 'api', '服务端', 'server', 'microservice',
            # Mobile
            'ios', 'android', 'flutter', 'mobile', '移动', 'app',
            # Database
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'database', '数据库',
            # DevOps/Infra
            'devops', 'sre', 'kubernetes', 'k8s', 'docker', 'aws', 'azure', 'gcp', 'cloud', '运维', '云',
            # AI/ML
            'ai', 'ml', 'machine learning', '机器学习', '算法', 'data scientist', 'nlp', 'tensorflow', 'pytorch',
            # Blockchain
            'blockchain', '区块链', 'web3', 'solidity', 'smart contract',
            # General dev terms
            '开发', 'developer', 'engineer', 'programmer', '程序员', '工程师', 'software', 'coding', 'code',
            '架构', 'architect', '全栈', 'fullstack', 'tech', '技术',
            # Testing
            '测试', 'qa', 'test', 'automation',
            # Security
            '安全', 'security', 'penetration', '渗透',
        ]
        
        return any(kw in text_lower for kw in dev_keywords)

    def _extract_region(self, text: str) -> str:
        """Extract specific region/timezone restriction from text.
        Only match when there's an EXPLICIT region requirement, not just keyword presence.
        """
        import re
        text_lower = text.lower()

        # Explicit region restriction patterns (more strict matching)
        # US restrictions
        us_patterns = [
            r'\bus\s*only\b', r'\busa\s*only\b', r'\bus\s*based\b', r'\bus\s*residents?\b',
            r'united\s+states\s+only', r'america\s+only', r'仅限美国', r'美国地区',
        ]
        if any(re.search(p, text_lower) for p in us_patterns):
            return 'US'
        
        # EU restrictions
        eu_patterns = [
            r'\beu\s*only\b', r'\beurope\s*only\b', r'\beuropean\s+only\b', 
            r'\beu\s*based\b', r'\beurope\s*based\b', r'\bemea\s*only\b',
            r'仅限欧洲', r'欧洲地区',
        ]
        if any(re.search(p, text_lower) for p in eu_patterns):
            return 'EU'
        
        # China restrictions
        cn_patterns = [
            r'仅限中国', r'中国地区', r'仅限国内', r'国内地区', r'限中国大陆',
            r'\bchina\s*only\b', r'\bchina\s*based\b',
        ]
        if any(re.search(p, text_lower) for p in cn_patterns):
            return 'CN'
        
        # APAC restrictions
        apac_patterns = [
            r'\bapac\s*only\b', r'\basia\s*only\b', r'\basia[\s-]*pacific\s*only\b',
            r'仅限亚太', r'亚太地区',
        ]
        if any(re.search(p, text_lower) for p in apac_patterns):
            return 'APAC'
        
        # Check for explicit timezone requirements
        # Match patterns like "UTC+8 required", "需要配合 UTC-5"
        tz_pattern = r'(utc|gmt)\s*([+-]\d{1,2})\s*(required|时区|工作时间|配合)'
        tz_match = re.search(tz_pattern, text_lower)
        if tz_match:
            offset = tz_match.group(2)
            return f'UTC{offset}'
        
        # Named timezone requirements (only if explicitly required)
        if re.search(r'\b(pst|pacific\s+time)\s*(required|时区|工作时间)', text_lower):
            return 'UTC-8'
        if re.search(r'\b(est|eastern\s+time)\s*(required|时区|工作时间)', text_lower):
            return 'UTC-5'
        if re.search(r'(北京时间|东八区)\s*(工作|配合|required)', text_lower):
            return 'UTC+8'

        # Default to worldwide if no specific region found
        return 'worldwide'

    def _extract_work_type(self, text: str) -> str:
        """Extract work type from text"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['兼职', 'part-time', 'part time', 'parttime']):
            return 'parttime'
        elif any(word in text_lower for word in ['合同', 'contract', '外包', 'freelance', '项目制']):
            return 'contract'
        elif any(word in text_lower for word in ['实习', 'intern', 'internship']):
            return 'contract'

        return 'fulltime'

    def _timestamp_to_iso(self, timestamp: int) -> str:
        """Convert Unix timestamp to ISO format string"""
        if not timestamp:
            return None
        from datetime import datetime
        return datetime.fromtimestamp(timestamp).isoformat()
