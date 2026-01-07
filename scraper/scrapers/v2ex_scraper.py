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
        title_lower = title.lower()
        desc_lower = description.lower()
        
        # Order matters: more specific categories first
        keywords = {
            'mobile': ['移动', 'mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin', 'app开发', 'dart'],
            'blockchain': ['blockchain', '区块链', 'web3', 'solidity', 'crypto', 'defi', 'smart contract'],
            'ai': ['ai', 'ml', 'machine learning', '机器学习', '人工智能', 'data scientist', 'nlp', '算法', 'deep learning', 'pytorch', 'tensorflow'],
            'devops': ['devops', 'sre', 'infrastructure', '运维', 'kubernetes', 'k8s', 'docker', '云原生', 'aws', 'azure', 'gcp'],
            'fullstack': ['全栈', 'fullstack', 'full-stack', 'full stack'],
            'frontend': ['前端', 'frontend', 'react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'web前端'],
            'backend': ['后端', 'backend', 'go', 'golang', 'java', 'python', 'php', 'ruby', 'rust', 'node', 'c++', 'c#', '服务端', 'spring', 'django', 'fastapi'],
        }

        # Check title first (higher priority)
        for category, terms in keywords.items():
            if any(term in title_lower for term in terms):
                return category

        # Then check description
        for category, terms in keywords.items():
            if any(term in desc_lower for term in terms):
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
        """Extract specific region/timezone restriction from text"""
        text_lower = text.lower()

        # Check for specific country/region mentions
        # United States
        if any(word in text_lower for word in ['usa', 'us only', 'united states', 'america only', '美国']):
            return 'US'
        
        # Europe
        if any(word in text_lower for word in ['europe', 'eu only', 'european', 'uk only', 'emea', '欧洲']):
            return 'EU'
        
        # China
        if any(word in text_lower for word in ['国内', '仅限中国', '中国地区', '大陆', 'china only']):
            return 'CN'
        
        # Asia-Pacific (use word boundary to avoid matching 'Apache')
        import re
        if re.search(r'\b(asia|apac|asia-pacific)\b', text_lower) or '亚太' in text_lower or 'southeast asia' in text_lower:
            return 'APAC'
        
        # Check for timezone mentions
        import re
        # Match patterns like UTC+8, UTC-5, GMT+8
        tz_pattern = r'(utc|gmt)\s*([+-]\d{1,2})'
        tz_match = re.search(tz_pattern, text_lower)
        if tz_match:
            offset = tz_match.group(2)
            return f'UTC{offset}'
        
        # Match named timezones
        if 'pst' in text_lower or 'pacific time' in text_lower:
            return 'UTC-8'
        if 'est' in text_lower or 'eastern time' in text_lower:
            return 'UTC-5'
        if 'cst' in text_lower and '中国' not in text_lower:  # CST can be US Central or China
            return 'UTC-6'
        if '北京时间' in text_lower or '东八区' in text_lower:
            return 'UTC+8'

        # Check for worldwide indicators (no restriction)
        if any(word in text_lower for word in ['全球', 'worldwide', 'global', 'anywhere', '不限地区', 'remote friendly']):
            return 'worldwide'

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
