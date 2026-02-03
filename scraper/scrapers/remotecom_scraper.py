"""
Remote.com Jobs Scraper

Scrapes remote engineering job listings from remote.com by parsing
the embedded Next.js JSON data in the page source.
"""

import re
import json
import httpx
from typing import List, Dict


class RemoteComScraper:
    """Scraper for remote.com job listings using embedded JSON data"""
    
    BASE_URL = "https://remote.com"
    JOBS_PATH = "/jobs/all"
    MAX_PAGES = 13  # Based on pagination analysis
    
    # Query parameters for engineer jobs
    QUERY_PARAMS = {
        "query": "engineer",
        "workplaceLocation": "remote",
        "country": "anywhere"
    }
    
    async def scrape(self) -> List[Dict]:
        """Fetch remote engineer jobs from remote.com"""
        import asyncio
        all_jobs = []
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            client.headers.update({
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })
            
            for page in range(1, self.MAX_PAGES + 1):
                try:
                    params = {**self.QUERY_PARAMS, "page": page}
                    url = f"{self.BASE_URL}{self.JOBS_PATH}"
                    
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    
                    jobs = self._parse_page(response.text)
                    if not jobs:
                        break
                        
                    all_jobs.extend(jobs)
                    print(f"  Remote.com page {page}: found {len(jobs)} jobs")
                    
                    # Rate limiting
                    await asyncio.sleep(1.5)
                except Exception as e:
                    print(f"  Remote.com page {page} error: {e}")
                    break
        
        return all_jobs
    
    def _parse_page(self, html: str) -> List[Dict]:
        """Parse job listings from embedded Next.js JSON data"""
        jobs = []

        items = self._extract_jobs_data(html)
        if not items:
            return jobs

        seen_slugs = set()
        for item in items:
            if item.get("status") != "published":
                continue

            title = item.get("title") or ""
            slug = item.get("slug") or ""
            inserted_at = item.get("insertedAt") or ""
            published_at = item.get("publishedAt") or ""
            company_profile = item.get("companyProfile") or {}
            company = company_profile.get("name") if isinstance(company_profile, dict) else None
            if not company:
                company = self._extract_company_from_slug(slug)

            if not slug or slug in seen_slugs:
                continue
            seen_slugs.add(slug)

            # Skip non-dev jobs
            if not self._is_dev_job(title):
                continue

            apply_url = item.get("applyUrl") or ""
            company_slug = ""
            if isinstance(company_profile, dict):
                company_slug = company_profile.get("slug") or ""

            if company_slug:
                original_url = f"{self.BASE_URL}/jobs/{company_slug}/{slug}"
            else:
                original_url = f"{self.BASE_URL}/jobs/all?jobId={slug}"

            job = {
                'source_id': f"remotecom-{slug}",
                'title': title[:255],
                'company': company[:255] if company else 'Unknown',
                'category': self._extract_category(title),
                'region_limit': 'worldwide',
                'work_type': 'fulltime',
                'source_site': 'remotecom',
                'original_url': original_url,
                'apply_url': apply_url if apply_url else None,
                'description': title,
                'date_posted': published_at or inserted_at,
            }
            jobs.append(job)

        return jobs

    def _extract_jobs_data(self, html: str) -> List[Dict]:
        """Extract jobs list from Next.js flight data payloads."""
        # The jobs payload is embedded inside self.__next_f.push([1,"..."])
        # entries. Decode those string chunks and look for a JSON object
        # containing the "jobs" array.
        chunks = re.findall(
            r'self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)',
            html,
            re.DOTALL,
        )
        for chunk in chunks:
            try:
                decoded = json.loads(f"\"{chunk}\"")
            except Exception:
                continue

            jobs = self._extract_jobs_from_text(decoded)
            if jobs:
                return jobs

        # Fallback: try scanning raw HTML if no chunks matched.
        return self._extract_jobs_from_text(html)

    def _extract_jobs_from_text(self, text: str) -> List[Dict]:
        """Find and parse the smallest JSON object containing a jobs list."""
        idx = text.find('"jobs":[')
        if idx == -1:
            return []

        start = text.rfind('{', 0, idx)
        if start == -1:
            return []

        depth = 0
        end = None
        for i in range(start, len(text)):
            ch = text[i]
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break

        if end is None:
            return []

        snippet = text[start:end]
        try:
            obj = json.loads(snippet)
        except Exception:
            return []

        jobs = obj.get("jobs")
        return jobs if isinstance(jobs, list) else []
    
    def _extract_company_from_slug(self, slug: str) -> str:
        """Extract company name from slug if no company info available"""
        # Slug format: job-title-j1xxxxx
        # Remove the job ID suffix
        name = re.sub(r'-j[a-z0-9]+$', '', slug)
        return name.replace('-', ' ').title()[:100]
    
    def _is_dev_job(self, title: str) -> bool:
        """Check if job is development related"""
        title_lower = title.lower()
        
        dev_keywords = [
            'developer', 'engineer', 'programmer', 'architect',
            'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack',
            'software', 'web', 'mobile', 'ios', 'android',
            'python', 'java', 'javascript', 'react', 'node', 'typescript',
            'devops', 'sre', 'data engineer', 'ml', 'mlops',
            'golang', 'rust', 'ruby', 'php', 'vue', 'angular', 'elixir',
        ]
        
        exclude_keywords = [
            'sales engineer', 'customer support', 'account manager',
            'marketing', 'hr ', 'recruiter', 'customer service',
            'account executive', 'operations manager',
        ]
        
        has_dev = any(kw in title_lower for kw in dev_keywords)
        is_excluded = any(kw in title_lower for kw in exclude_keywords)
        
        return has_dev and not is_excluded
    
    def _extract_category(self, title: str) -> str:
        """Extract job category from title"""
        title_lower = title.lower()
        
        if any(kw in title_lower for kw in ['frontend', 'front-end', 'react', 'vue', 'angular', 'css']):
            return 'frontend'
        if any(kw in title_lower for kw in ['backend', 'back-end', 'node', 'python', 'java', 'golang', 'ruby', 'php', 'elixir']):
            return 'backend'
        if any(kw in title_lower for kw in ['fullstack', 'full-stack', 'full stack']):
            return 'fullstack'
        if any(kw in title_lower for kw in ['mobile', 'ios', 'android', 'flutter', 'react native']):
            return 'mobile'
        if any(kw in title_lower for kw in ['devops', 'sre', 'infrastructure', 'cloud', 'kubernetes', 'platform']):
            return 'devops'
        if any(kw in title_lower for kw in ['data', 'ml', 'mlops', 'machine learning', 'ai']):
            return 'ai'
        if any(kw in title_lower for kw in ['security', 'infosec', 'penetration']):
            return 'security'
        
        return 'unknown'
