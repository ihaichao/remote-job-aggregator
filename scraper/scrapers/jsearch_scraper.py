"""
JSearch API Scraper

Fetches remote developer jobs from JSearch API (RapidAPI)
which aggregates data from LinkedIn, Indeed, Glassdoor, etc.

Requires: RAPIDAPI_KEY environment variable
"""

import os
import httpx
from typing import List, Dict
from datetime import datetime


class JSearchScraper:
    """Scraper for JSearch API (RapidAPI)"""
    
    API_HOST = "jsearch.p.rapidapi.com"
    API_URL = "https://jsearch.p.rapidapi.com/search"
    
    # Remote job search queries targeting Chinese developers
    SEARCH_QUERIES = [
        "remote software developer",
        "remote frontend developer",
        "remote backend developer",
        "remote full stack developer",
    ]
    
    def __init__(self):
        self.api_key = os.getenv('RAPIDAPI_KEY')
        if not self.api_key:
            raise ValueError("RAPIDAPI_KEY environment variable is required")
    
    async def scrape(self) -> List[Dict]:
        """Fetch remote jobs from JSearch API"""
        all_jobs = []
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.API_HOST
        }
        
        async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
            for query in self.SEARCH_QUERIES:
                try:
                    jobs = await self._search(client, query)
                    all_jobs.extend(jobs)
                except Exception as e:
                    print(f"  JSearch error for '{query}': {e}")
        
        # Deduplicate by job_id
        seen_ids = set()
        unique_jobs = []
        for job in all_jobs:
            if job['source_id'] not in seen_ids:
                seen_ids.add(job['source_id'])
                unique_jobs.append(job)
        
        return unique_jobs
    
    async def _search(self, client: httpx.AsyncClient, query: str) -> List[Dict]:
        """Search for jobs with a specific query"""
        jobs = []
        
        params = {
            "query": query,
            "page": "1",
            "num_pages": "3",  # Fetch 3 pages (30 jobs per query)
            "remote_jobs_only": "true",
        }
        
        response = await client.get(self.API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        for item in data.get('data', []):
            job = self._map_job(item)
            if job:
                # Only keep jobs available to Chinese developers (CN or worldwide)
                if job['region_limit'] in ['CN', 'worldwide']:
                    jobs.append(job)
        
        return jobs
    
    def _map_job(self, item: Dict) -> Dict:
        """Map JSearch job data to our schema"""
        title = item.get('job_title', '')
        
        # Skip non-dev jobs
        if not self._is_dev_job(title):
            return None
        
        return {
            'source_id': item.get('job_id', ''),
            'title': title,
            'company': item.get('employer_name', 'Unknown'),
            'category': self._extract_category(title),
            'region_limit': self._extract_region(item),
            'work_type': self._extract_work_type(item),
            'source_site': 'jsearch',
            'original_url': item.get('job_apply_link', ''),
            'description': item.get('job_description', '')[:5000],  # Limit description length
            'date_posted': self._parse_date(item.get('job_posted_at_datetime_utc')),
        }
    
    def _extract_region(self, item: Dict) -> str:
        """Extract region limit from job location data"""
        country = (item.get('job_country') or '').upper()
        is_remote = item.get('job_is_remote', False)
        
        # If truly remote with no country restriction, it's worldwide
        if is_remote and not country:
            return 'worldwide'
        
        # Map country codes to regions
        us_codes = ['US', 'USA', 'UNITED STATES']
        eu_codes = ['GB', 'UK', 'DE', 'FR', 'NL', 'ES', 'IT', 'SE', 'PL', 'AT', 'BE', 'CH', 'IE', 'DK', 'NO', 'FI', 'PT']
        cn_codes = ['CN', 'CHINA']
        
        if country in us_codes:
            return 'US'
        if country in eu_codes:
            return 'EU'
        if country in cn_codes:
            return 'CN'
        
        # For remote jobs, assume worldwide unless explicitly restricted
        if is_remote:
            return 'worldwide'
        
        # Non-remote jobs default to their country if specified
        return country if country else 'worldwide'
    
    def _is_dev_job(self, title: str) -> bool:
        """Check if job is development related"""
        title_lower = title.lower()
        dev_keywords = [
            'developer', 'engineer', 'programmer', 'architect',
            'frontend', 'backend', 'fullstack', 'full-stack',
            'software', 'web', 'mobile', 'ios', 'android',
            'python', 'java', 'javascript', 'react', 'node',
            'devops', 'sre', 'data', 'ml', 'ai',
        ]
        return any(kw in title_lower for kw in dev_keywords)
    
    def _extract_category(self, title: str) -> str:
        """Extract job category from title"""
        title_lower = title.lower()
        
        if any(kw in title_lower for kw in ['frontend', 'front-end', 'react', 'vue', 'angular']):
            return 'frontend'
        if any(kw in title_lower for kw in ['backend', 'back-end', 'node', 'python', 'java', 'go']):
            return 'backend'
        if any(kw in title_lower for kw in ['fullstack', 'full-stack', 'full stack']):
            return 'fullstack'
        if any(kw in title_lower for kw in ['mobile', 'ios', 'android', 'flutter']):
            return 'mobile'
        if any(kw in title_lower for kw in ['devops', 'sre', 'infrastructure', 'cloud']):
            return 'devops'
        if any(kw in title_lower for kw in ['data', 'ml', 'machine learning', 'ai']):
            return 'ai'
        
        return 'unknown'
    
    def _extract_work_type(self, item: Dict) -> str:
        """Extract work type from job data"""
        employment_type = item.get('job_employment_type', '').lower()
        
        if 'part' in employment_type:
            return 'parttime'
        if 'contract' in employment_type:
            return 'contract'
        return 'fulltime'
    
    def _parse_date(self, date_str: str) -> str:
        """Parse date string to ISO format"""
        if not date_str:
            return datetime.utcnow().isoformat()
        try:
            # JSearch uses ISO format
            return date_str
        except:
            return datetime.utcnow().isoformat()
