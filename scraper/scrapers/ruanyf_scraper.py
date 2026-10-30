"""
ruanyf/weekly "谁在招人" Scraper

Ruan Yifeng opens one GitHub issue per month where teams post jobs as
comments. Most posts are on-site, so only comments whose heading says the
job is remote, or whose body states a remote work mode, are kept.
"""

import re
from datetime import datetime
from typing import Dict, List, Optional

import httpx

from utils.ai_classifier import AIClassifier
from utils.github_hiring import (
    GITHUB_API, clean_heading, extract_company, extract_region, extract_work_type,
    github_headers, is_tech_role, mentions_remote,
)
from utils.job_details import clean_markdown
from utils.retention import is_past_retention


class RuanyfScraper:
    """Scraper for job comments on ruanyf/weekly "谁在招人" issues"""

    REPO = "ruanyf/weekly"
    ISSUE_COUNT = 3  # this month plus the two before; posts stay valid for a while
    MAX_COMMENT_PAGES = 3

    # Body lines that state the work mode, e.g. "工作方式： Remote / 远程"
    _REMOTE_MODE_RE = re.compile(
        r'(工作方式|办公方式|工作形式|工作模式|办公模式|合作方式|work\s*(mode|type|style)|location)'
        r'[*\s]*[:：][*\s]*[^\n]{0,10}(远程|remote)'
        r'|全职或远程|全远程|远程优先|可远程办公|fully\s+remote|100%\s*remote|remote[\s-]first',
        re.I,
    )
    # Job seekers occasionally post their résumé in the thread
    _RESUME_RE = re.compile(r'求职|期望工作方式|期望薪资|目前状态|个人简历')

    def __init__(self, db=None):
        self.ai_classifier = AIClassifier()
        self.db = db

    async def scrape(self) -> List[Dict]:
        all_jobs = []
        async with httpx.AsyncClient(headers=github_headers(), timeout=30.0) as client:
            try:
                issues = await self._recent_issues(client)
            except Exception as e:
                print(f"  ruanyf: failed to list hiring issues: {e}")
                return []

            for issue in issues:
                try:
                    comments = await self._issue_comments(client, issue['number'])
                except Exception as e:
                    print(f"  ruanyf: failed to fetch comments of #{issue['number']}: {e}")
                    continue

                found = 0
                for comment in comments:
                    job = self._parse_comment(comment)
                    if not job or is_past_retention(job['date_posted']):
                        continue
                    if self.db and self.db.job_exists(job['title'], job['original_url']):
                        continue
                    job['category'] = await self.ai_classifier.classify_category(
                        job['title'], job['description']
                    )
                    all_jobs.append(job)
                    found += 1
                print(f"  ruanyf {issue['title']}: {len(comments)} posts, {found} new remote jobs")

        return all_jobs

    async def _recent_issues(self, client: httpx.AsyncClient) -> List[Dict]:
        response = await client.get(f"{GITHUB_API}/search/issues", params={
            "q": f"repo:{self.REPO} author:ruanyf is:issue 谁在招人 in:title",
            "sort": "created",
            "order": "desc",
            "per_page": self.ISSUE_COUNT,
        })
        response.raise_for_status()
        return response.json().get("items", [])

    async def _issue_comments(self, client: httpx.AsyncClient, number: int) -> List[Dict]:
        comments = []
        for page in range(1, self.MAX_COMMENT_PAGES + 1):
            response = await client.get(
                f"{GITHUB_API}/repos/{self.REPO}/issues/{number}/comments",
                params={"per_page": 100, "page": page},
            )
            response.raise_for_status()
            batch = response.json()
            comments.extend(batch)
            if len(batch) < 100:
                break
        return comments

    def _parse_comment(self, comment: Dict) -> Optional[Dict]:
        """Turn a remote, tech hiring comment into a job dict (category filled in later)"""
        if (comment.get('user') or {}).get('type') == 'Bot':
            return None
        body = (comment.get('body') or '').strip()
        lines = [line for line in body.split('\n') if line.strip()]
        # Replies quoting another post start with ">"
        if not lines or lines[0].lstrip().startswith('>'):
            return None

        title = clean_heading(lines[0])
        if len(title) < 4:
            return None
        if self._RESUME_RE.search(body[:500]):
            return None
        if not (mentions_remote(title) or self._REMOTE_MODE_RE.search(body)):
            return None
        if not is_tech_role(title + '\n' + body[:1500]):
            return None

        posted = datetime.fromisoformat(comment['created_at'].replace('Z', '+00:00'))
        return {
            'source_id': f"ruanyf-{comment['id']}",
            'title': title[:255],
            'company': extract_company(title)[:255],
            'tags': [],
            'region_limit': extract_region(title + '\n' + body),
            'work_type': extract_work_type(title),
            'source_site': 'ruanyf',
            'original_url': comment['html_url'],
            'apply_url': None,
            'description': clean_markdown(body),
            'date_posted': posted.isoformat(),
        }


if __name__ == "__main__":
    import asyncio

    async def test():
        jobs = await RuanyfScraper().scrape()
        print(f"Scraped {len(jobs)} jobs")
        for job in jobs:
            print(f"- {job['title']} @ {job['company']} [{job['region_limit']}] ({job['date_posted']})")

    asyncio.run(test())
