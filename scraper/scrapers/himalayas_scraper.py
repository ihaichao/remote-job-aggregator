"""
Himalayas Scraper

Fetches remote jobs open to candidates in China from the public Himalayas
search API (no key required). Only developer / data roles are kept.

API terms: every apply action must use the supplied applicationLink, and
Himalayas must be credited as the source. The jobs must not be passed on to
other job boards, aggregators, Google Jobs or LinkedIn Jobs.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import httpx

from utils.ai_classifier import AIClassifier
from utils.job_details import html_to_markdown
from utils.retention import is_past_retention


class HimalayasScraper:
    """Scraper for himalayas.app using its JSON search API"""

    API_URL = "https://himalayas.app/jobs/api/search"
    # country=CN also returns worldwide jobs; sort=recent lets us stop at the cutoff
    QUERY_PARAMS = {"country": "CN", "sort": "recent"}
    MAX_PAGES = 20  # 20 jobs per page
    MAX_AGE_DAYS = 30
    DEV_CATEGORIES = {'Developer', 'Data Science'}

    WORK_TYPES = {
        'Part Time': 'parttime',
        'Contractor': 'parttime',
    }

    def __init__(self, db=None):
        self.ai_classifier = AIClassifier()
        self.db = db

    async def scrape(self) -> List[Dict]:
        """Fetch recent developer jobs open to China, newest first"""
        all_jobs = []
        cutoff = datetime.now(timezone.utc) - timedelta(days=self.MAX_AGE_DAYS)

        headers = {
            "User-Agent": "remotecn.com job aggregator (+https://remotecn.com)",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            for page in range(1, self.MAX_PAGES + 1):
                try:
                    response = await client.get(self.API_URL, params={**self.QUERY_PARAMS, "page": page})
                    response.raise_for_status()
                    items = response.json().get("jobs", [])
                except Exception as e:
                    print(f"  Himalayas API error on page {page}: {e}")
                    break

                if not items:
                    break

                reached_cutoff = False
                dev_jobs = 0
                new_jobs = []
                for item in items:
                    job = self._parse_job(item)
                    if not job:
                        continue
                    posted = datetime.fromisoformat(job['date_posted'])
                    if posted < cutoff:
                        reached_cutoff = True
                        break
                    if not self._is_dev_job(item):
                        continue
                    dev_jobs += 1
                    if is_past_retention(job['date_posted']):
                        continue
                    if self.db and self.db.job_exists(job['title'], job['original_url']):
                        continue
                    new_jobs.append(job)

                for job in new_jobs:
                    job['category'] = await self.ai_classifier.classify_category(
                        job['title'], job.get('description', '')
                    )
                all_jobs.extend(new_jobs)
                print(f"  Himalayas page {page}: {dev_jobs} dev jobs, {len(new_jobs)} new")

                # Results are newest first: a page whose dev jobs are all known means
                # everything after it was seen on an earlier run
                if reached_cutoff or (self.db and dev_jobs and not new_jobs):
                    break
                await asyncio.sleep(0.5)

        return all_jobs

    def _is_dev_job(self, item: Dict) -> bool:
        return bool(self.DEV_CATEGORIES & set(item.get('parentCategories') or []))

    def _parse_job(self, item: Dict) -> Optional[Dict]:
        """Map one API job to our job dict (category is filled in later)"""
        title = (item.get('title') or '').strip()
        url = item.get('guid') or ''
        pub_date = item.get('pubDate')
        if not title or not url or not pub_date:
            return None

        posted = datetime.fromtimestamp(int(pub_date), tz=timezone.utc)
        # An empty restriction list means the job is open worldwide; otherwise
        # country=CN guarantees China is on the list
        region = 'CN' if item.get('locationRestrictions') else 'worldwide'

        return {
            'source_id': f"himalayas-{url.rstrip('/').split('/')[-1]}",
            'title': title[:255],
            'company': (item.get('companyName') or 'Unknown')[:255],
            'tags': [],
            'region_limit': region,
            'work_type': self.WORK_TYPES.get(item.get('employmentType'), 'fulltime'),
            'source_site': 'himalayas',
            'original_url': url,
            'apply_url': item.get('applicationLink') or url,
            'description': html_to_markdown(item.get('description') or '') or (item.get('excerpt') or ''),
            'date_posted': posted.isoformat(),
        }


if __name__ == "__main__":
    async def test():
        jobs = await HimalayasScraper().scrape()
        print(f"Scraped {len(jobs)} jobs")
        for job in jobs[:5]:
            print(f"- {job['title']} @ {job['company']} [{job['region_limit']}] ({job['date_posted']})")

    asyncio.run(test())
