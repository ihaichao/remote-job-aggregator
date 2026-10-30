"""
rebase-network/who-is-hiring Scraper

Rebase (a Chinese Web3 community) collects job posts as GitHub issues, one
issue per post, with the location in the title, e.g. "[远程] ... 诚聘 ...".
Only remote tech roles are kept.
"""

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


class RebaseScraper:
    """Scraper for job issues on rebase-network/who-is-hiring"""

    REPO = "rebase-network/who-is-hiring"
    MAX_PAGES = 2  # 100 issues per page, newest first
    # Maintainers tag posts missing salary / company / contact details
    SKIP_LABELS = {'needs-info'}

    def __init__(self, db=None):
        self.ai_classifier = AIClassifier()
        self.db = db

    async def scrape(self) -> List[Dict]:
        all_jobs = []
        async with httpx.AsyncClient(headers=github_headers(), timeout=30.0) as client:
            for page in range(1, self.MAX_PAGES + 1):
                try:
                    response = await client.get(f"{GITHUB_API}/repos/{self.REPO}/issues", params={
                        "state": "open",
                        "sort": "created",
                        "direction": "desc",
                        "per_page": 100,
                        "page": page,
                    })
                    response.raise_for_status()
                    issues = response.json()
                except Exception as e:
                    print(f"  Rebase API error on page {page}: {e}")
                    break

                reached_retention = False
                new_jobs = []
                for issue in issues:
                    job = self._parse_issue(issue)
                    if not job:
                        continue
                    if is_past_retention(job['date_posted']):
                        reached_retention = True
                        break
                    if self.db and self.db.job_exists(job['title'], job['original_url']):
                        continue
                    new_jobs.append(job)

                for job in new_jobs:
                    job['category'] = await self.ai_classifier.classify_category(
                        job['title'], job['description']
                    )
                all_jobs.extend(new_jobs)
                print(f"  Rebase page {page}: {len(issues)} issues, {len(new_jobs)} new remote jobs")

                if reached_retention or len(issues) < 100:
                    break

        return all_jobs

    def _parse_issue(self, issue: Dict) -> Optional[Dict]:
        """Turn a remote, tech job issue into a job dict (category filled in later)"""
        if 'pull_request' in issue:
            return None
        if self.SKIP_LABELS & {label.get('name') for label in issue.get('labels', [])}:
            return None

        title = clean_heading(issue.get('title') or '')
        if not mentions_remote(title) or not is_tech_role(title):
            return None

        body = issue.get('body') or ''
        posted = datetime.fromisoformat(issue['created_at'].replace('Z', '+00:00'))
        return {
            'source_id': f"rebase-{issue['number']}",
            'title': title[:255],
            'company': extract_company(title)[:255],
            'tags': [],
            'region_limit': extract_region(title),
            'work_type': extract_work_type(title),
            'source_site': 'rebase',
            'original_url': issue['html_url'],
            'apply_url': None,
            'description': clean_markdown(body),
            'date_posted': posted.isoformat(),
        }


if __name__ == "__main__":
    import asyncio

    async def test():
        jobs = await RebaseScraper().scrape()
        print(f"Scraped {len(jobs)} jobs")
        for job in jobs:
            print(f"- {job['title']} @ {job['company']} [{job['region_limit']}] ({job['date_posted']})")

    asyncio.run(test())
