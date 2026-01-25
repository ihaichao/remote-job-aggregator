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
        """Scrape a specific V2EX node using API only"""
        if not self.token:
            raise ValueError("V2EX_TOKEN is required. Please set the V2EX_TOKEN environment variable.")
        
        return await self._scrape_via_api(client, node)

    async def _scrape_via_api(self, client: httpx.AsyncClient, node: str) -> List[Dict]:
        """Scrape using V2EX API v2 (requires token) with pagination"""
        import asyncio
        jobs = []
        MAX_PAGES = 10  # Maximum pages to fetch (10 pages * 20 items = 200 jobs max)

        for page in range(1, MAX_PAGES + 1):
            url = f"{self.API_BASE}/nodes/{node}/topics?p={page}"
            
            try:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
            except Exception as e:
                print(f"  V2EX page {page} error: {e}")
                break

            if not data.get('success'):
                # Page number exceeds limit
                break

            results = data.get('result', [])
            if not results:
                break

            for topic in results:
                title = topic.get('title', '')

                # Skip internship jobs
                if any(kw in title.lower() for kw in ['实习', 'intern', 'internship']):
                    continue

                # Skip job seeker posts (people looking for work, not job postings)
                if any(kw in title for kw in ['接活', '求职', '找工作', '求兼职', '寻求', '接单', '接私活', '找兼职', '难找', '想找', '找远程', '在找']):
                    continue

                # Skip non-tech roles (operations, marketing, HR, sales, design, SEO, etc.)
                if any(kw in title.lower() for kw in ['运营', '市场', 'marketing', '销售', 'sales', 'hr', 'hrbp', '人事', '招聘', '客服', 'customer', 'ux', 'ui', '设计师', 'designer', '设计', 'figma', 'sketch', '交互设计', '视觉设计', 'seo']):
                    continue

                # Skip jobs not related to software development
                content = topic.get('content', '')
                full_text = title + ' ' + content
                if not self._is_dev_related(full_text):
                    continue

                # Filter for remote keywords in title or content (applies to all nodes)
                if not any(kw in full_text for kw in self.REMOTE_KEYWORDS):
                    continue

                category = self._extract_category(title, content)
                
                # Skip jobs with unknown category
                if category == 'unknown':
                    continue

                job = {
                    'source_id': str(topic['id']),
                    'title': title,
                    'company': self._extract_company(title, content),
                    'category': category,
                    'region_limit': self._extract_region(full_text),
                    'work_type': self._extract_work_type(full_text),
                    'source_site': 'v2ex',
                    'original_url': topic.get('url', f"https://www.v2ex.com/t/{topic['id']}"),
                    'description': content,
                    'date_posted': self._timestamp_to_iso(topic.get('created')),
                }
                jobs.append(job)

            # If less than 20 results, no more pages
            if len(results) < 20:
                break
            
            # Rate limiting between pages
            await asyncio.sleep(0.5)

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
        For titles with multiple roles, use the first matching keyword position.
        """
        import re
        title_lower = title.lower()
        desc_lower = description.lower()
        
        # Keywords for each category
        # Core roles checked first, then specialized roles
        keywords = {
            'frontend': ['前端', 'frontend', 'web前端'],
            'backend': ['后端', 'backend', '服务端', 'server', r'\bjava\b', r'\bphp\b', r'\bgolang\b', r'\bgo\b', 'python', 'ruby', 'rust', '架构师'],
            'fullstack': ['全栈', 'fullstack', 'full-stack', 'full stack'],
            'mobile': ['移动开发', r'\bios\b', r'\bandroid\b', 'flutter', 'react native', 'app开发', '安卓'],
            # Game category: only match specific game engine/role keywords, not generic '游戏'
            'game': ['cocos', 'unity', 'unreal', 'ue4', 'ue5', '游戏客户端', 'game dev', '游戏引擎'],
            'security': ['安全', 'security', '渗透', 'penetration', 'red team', '攻防', 'infosec', '漏洞'],
            'quant': ['量化', 'quantitative', '风控开发', 'trading'],
            'devops': ['devops', r'\bsre\b', '运维', 'kubernetes', r'\bk8s\b', 'docker', '云原生'],
            'blockchain': ['blockchain', '区块链', 'web3', 'solidity', 'smart contract', '合约', '撮合交易'],
            'ai': ['machine learning', '机器学习', '人工智能', 'data scientist', r'\bnlp\b', '算法工程师', 'deep learning'],
        }

        def find_first_match_pos(text: str, terms: list) -> int:
            """Find the earliest position where any term matches. Returns -1 if no match."""
            min_pos = -1
            for term in terms:
                if term.startswith(r'\b'):
                    # Regex matching
                    match = re.search(term, text)
                    if match:
                        pos = match.start()
                        if min_pos == -1 or pos < min_pos:
                            min_pos = pos
                else:
                    # Simple substring matching
                    pos = text.find(term)
                    if pos != -1 and (min_pos == -1 or pos < min_pos):
                        min_pos = pos
            return min_pos

        # Find all matching categories and their first match position in title
        title_matches = []
        
        # Priority categories - if any of these match, use them directly
        # These are explicit job role descriptions that should take precedence
        priority_categories = ['fullstack', 'game', 'quant', 'security', 'blockchain', 'ai', 'devops']
        
        for category, terms in keywords.items():
            pos = find_first_match_pos(title_lower, terms)
            if pos != -1:
                # Priority categories get a very low position to ensure they win
                if category in priority_categories:
                    title_matches.append((-1000 + priority_categories.index(category), category))
                else:
                    title_matches.append((pos, category))
        
        # Return the category with earliest match position
        if title_matches:
            title_matches.sort(key=lambda x: x[0])
            return title_matches[0][1]

        # Fall back to description
        for category, terms in keywords.items():
            if find_first_match_pos(desc_lower, terms) != -1:
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

        # Default to china for V2EX jobs (Chinese job board)
        return 'CN'

    def _extract_work_type(self, text: str) -> str:
        """Extract work type from text"""
        text_lower = text.lower()

        # Part-time keywords
        if any(word in text_lower for word in ['兼职', 'part-time', 'part time', 'parttime', 'freelance', '自由职业']):
            return 'parttime'
        
        # Everything else is full-time or defaults to full-time
        # (V2EX jobs are majority full-time unless specified)
        return 'fulltime'

    def _timestamp_to_iso(self, timestamp: int) -> str:
        """Convert Unix timestamp to ISO format string"""
        if not timestamp:
            return None
        from datetime import datetime
        return datetime.fromtimestamp(timestamp).isoformat()
