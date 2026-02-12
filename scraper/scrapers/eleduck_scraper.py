"""
Eleduck Scraper

Scrapes remote job listings from eleduck.com via its JSON API.
Supports pagination — fetches all jobs posted within the last 30 days.
"""

import re
import httpx
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from utils.ai_classifier import AIClassifier


class EleduckScraper:
    """Scraper for eleduck.com using paginated JSON API"""
    
    API_URL = "https://svc.eleduck.com/api/v1/posts"
    BASE_URL = "https://eleduck.com"
    CATEGORY_ID = 5  # 社区帖子招聘 (Job postings)
    PER_PAGE = 25
    
    def __init__(self):
        self.ai_classifier = AIClassifier()

    async def scrape(self) -> List[Dict]:
        """Fetch jobs from Eleduck API with pagination"""
        all_jobs = []
        one_month_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
        }
        
        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            page = 1
            stop = False
            
            while not stop:
                try:
                    response = await client.get(
                        self.API_URL,
                        params={"category": self.CATEGORY_ID, "page": page}
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    posts = data.get("posts", [])
                    pager = data.get("pager", {})
                    total_pages = pager.get("total_pages", 1)
                    
                    if not posts:
                        break
                    
                    for post in posts:
                        # Parse dates
                        pub_date = self._parse_date(post.get("published_at", ""))
                        touched_date = self._parse_date(post.get("touched_at", ""))
                        
                        # Posts are sorted by touched_at (last activity).
                        # Stop paginating once touched_at is older than 30 days.
                        if touched_date and touched_date < one_month_ago:
                            stop = True
                            break
                        
                        # Skip individual posts published more than 30 days ago
                        # (they appear on recent pages because someone commented)
                        if pub_date and pub_date < one_month_ago:
                            continue
                        
                        title = post.get("title", "") or post.get("full_title", "")
                        summary = post.get("summary", "") or ""
                        post_id = post.get("id", "")
                        
                        if not title:
                            continue
                        
                        # STAGE 1: Rule-based filter
                        if not self._is_dev_job(title, summary):
                            continue
                        
                        # STAGE 2: AI Semantic filter
                        if not await self.ai_classifier.is_job_posting(title, summary):
                            print(f"  AI skipped: {title}")
                            continue
                        
                        # Extract metadata from tags
                        tags = post.get("tags", [])
                        tag_names = [t.get("name", "") for t in tags]
                        
                        company = self._extract_company(title, summary)
                        category = self._extract_category(title, summary)
                        work_type = self._extract_work_type_from_tags(tag_names, title, summary)
                        
                        job = {
                            'source_id': f"eleduck-{post_id}",
                            'title': title[:255],
                            'company': company[:255],
                            'category': category,
                            'region_limit': 'CN',
                            'work_type': work_type,
                            'source_site': 'eleduck',
                            'original_url': f"{self.BASE_URL}/posts/{post_id}",
                            'apply_url': None,
                            'description': summary[:2000],
                            'date_posted': pub_date.isoformat() if pub_date else datetime.now(timezone.utc).isoformat(),
                        }
                        all_jobs.append(job)
                    
                    print(f"  Eleduck page {page}/{total_pages}: {len(all_jobs)} jobs so far")
                    
                    # Move to next page
                    if page >= total_pages:
                        break
                    page += 1
                    
                except Exception as e:
                    print(f"  Eleduck API error on page {page}: {e}")
                    break
        
        print(f"  Eleduck: {len(all_jobs)} jobs found (scanned {page} pages)")
        return all_jobs

    def _parse_date(self, date_str: str) -> datetime:
        """Parse ISO 8601 date string from the API"""
        if not date_str:
            return None
        try:
            # Handle format like "2026-02-10T20:08:07.144+08:00"
            return datetime.fromisoformat(date_str)
        except Exception:
            return None

    def _extract_work_type_from_tags(self, tag_names: List[str], title: str, description: str) -> str:
        """Extract work type from Eleduck tags"""
        for tag in tag_names:
            if tag in ('线上兼职', '线下兼职'):
                return 'parttime'
            if tag in ('全职远程', '全职坐班'):
                return 'fulltime'
        # Fallback to text analysis
        return self._extract_work_type(title, description)

    def _extract_company(self, title: str, description: str) -> str:
        """Extract company name from title or description"""
        # 1. Look for brackets
        brackets = re.findall(r'[【\[](.*?)[】\]]', title)
        for content in brackets:
            clean_content = content
            for kw in ['远程', '兼职', '全职', '长期', '招人', '急招', '招聘', '内推']:
                clean_content = clean_content.replace(kw, '').replace(' ', '')
            clean_content = clean_content.strip()
            if len(clean_content) >= 2:
                return clean_content
        
        # 2. Look for "招聘" separator
        if "招聘" in title:
            first_part = title.split("招聘")[0].strip()
            if 1 < len(first_part) < 20:
                return first_part
        
        return "Unknown"

    def _extract_category(self, title: str, description: str) -> str:
        """Categorize the job based on title and description"""
        text = (title + " " + description).lower()
        
        if any(kw in text for kw in ['frontend', 'front-end', '前端', 'react', 'vue', 'angular', 'flutter']):
            return 'frontend'
        if any(kw in text for kw in ['backend', 'back-end', '后端', 'python', 'java', 'go', 'golang', 'node', 'ruby', 'php']):
            return 'backend'
        if any(kw in text for kw in ['fullstack', 'full-stack', '全栈']):
            return 'fullstack'
        if any(kw in text for kw in ['mobile', 'ios', 'android', '移动端']):
            return 'mobile'
        if any(kw in text for kw in ['devops', 'sre', '运维', 'infrastructure']):
            return 'devops'
        if any(kw in text for kw in ['data', 'ml', 'ai', '算法', 'big data', '数据']):
            return 'ai'
        
        return 'unknown'

    def _extract_work_type(self, title: str, description: str) -> str:
        """Determine if it's fulltime or parttime"""
        text = (title + " " + description).lower()
        if any(kw in text for kw in ['兼职', 'part-time', 'parttime', '合约', 'contract']):
            return 'parttime'
        return 'fulltime'

    def _is_dev_job(self, title: str, description: str) -> bool:
        """Check if it's a software development job (and not a resume or showcase)"""
        text = (title + " " + description).lower()
        
        dev_keywords = [
            'developer', 'engineer', 'programmer', 'architect', '前端', '后端', '开发', '工程师', '全栈',
            'ios', 'android', 'flutter', 'react', 'vue', 'python', 'java', 'golang', 'rust',
            '招聘', '诚招', '寻找伙伴', '招人', 'solidity', 'web3', '区块链', 'blockchain',
            'devops', 'sre', '运维', '测试', 'qa', '产品', 'designer', '设计', 'ui', 'ux',
        ]
        
        exclude_keywords = [
            '求职', '寻找机会', '找工作', '老兵', '求带', '全职远程求', '本人', '自我介绍', '技术栈:',
            '介绍一下自己', '寻求', '探索', '我是', '目前是', '状态是', '目前在', '自由职业',
            '大厂', '丰富经验', '项目经验', '多年经验', '寻找长期方向', '求推荐', '求指点', '求关注',
            '背景', '个人简介', '个人简历', '我的经历',
            '分享', '教程', '感悟', '转行', '求助', '咨询', '防骗', '曝光', '问卷', '调查',
            '我开发的', '第一款', '初衷', '故事', '心得', '开源了', '作品', '项目展示',
            '如何', '突围', '探讨', '思考', '关于', '建议', '如虎添翼', '谈谈', '看法', '评价',
            '回馈', '抽奖', '讨论', '看法', '评价'
        ]
        
        if re.search(r'\d+\s*[年y(years?)].*?[经验exp]', title, re.IGNORECASE):
            return False

        has_dev = any(kw in text for kw in dev_keywords)
        is_negative = any(kw in title.lower() for kw in exclude_keywords)
        
        if "我" in title and "招聘" not in title:
            is_negative = True

        return has_dev and not is_negative


if __name__ == "__main__":
    import asyncio
    
    async def test():
        scraper = EleduckScraper()
        jobs = await scraper.scrape()
        print(f"Scraped {len(jobs)} jobs")
        for job in jobs[:5]:
            print(f"- {job['title']} @ {job['company']} ({job['date_posted']})")
    
    asyncio.run(test())
