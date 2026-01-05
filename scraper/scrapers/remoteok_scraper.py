import httpx
from typing import List, Dict
import asyncio

class RemoteOKScraper:
    API_URL = "https://remoteok.com/api"

    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    async def scrape(self) -> List[Dict]:
        """Scrape RemoteOK API for remote positions"""
        jobs = []

        async with httpx.AsyncClient(headers=self.HEADERS, follow_redirects=True, timeout=30.0) as client:
            try:
                response = await client.get(self.API_URL)
                response.raise_for_status()
                data = response.json()

                # First element is metadata, skip it
                for item in data[1:]:
                    if not item.get('position'):
                        continue

                    tags = item.get('tags', [])

                    job = {
                        'title': item['position'],
                        'company': item.get('company', 'Unknown'),
                        'company_logo': item.get('company_logo', ''),
                        'category': self._map_category(tags),
                        'tags': tags,
                        'region_limit': self._extract_region(item),
                        'work_type': 'fulltime',
                        'source_site': 'remoteok',
                        'original_url': item.get('url', f"https://remoteok.com/remote-jobs/{item.get('id', '')}"),
                        'description': item.get('description', ''),
                        'salary_min': self._parse_salary(item.get('salary_min')),
                        'salary_max': self._parse_salary(item.get('salary_max')),
                        'date_posted': item.get('date'),
                        'location_detail': item.get('location', ''),
                    }
                    jobs.append(job)

            except httpx.HTTPStatusError as e:
                print(f"HTTP error fetching RemoteOK: {e}")
            except Exception as e:
                print(f"Error scraping RemoteOK: {e}")

        return jobs

    def _map_category(self, tags: List[str]) -> str:
        """Map tags to job category"""
        if not tags:
            return 'unknown'

        tag_str = ' '.join(tags).lower()

        category_mapping = {
            'frontend': ['frontend', 'front-end', 'react', 'vue', 'angular', 'javascript', 'css'],
            'backend': ['backend', 'back-end', 'python', 'go', 'golang', 'java', 'ruby', 'php', 'rust', 'node'],
            'fullstack': ['fullstack', 'full-stack', 'full stack'],
            'mobile': ['mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
            'devops': ['devops', 'sre', 'infrastructure', 'kubernetes', 'aws', 'cloud'],
            'ai': ['machine learning', 'ml', 'ai', 'data science', 'nlp', 'deep learning'],
            'blockchain': ['blockchain', 'web3', 'solidity', 'crypto', 'defi'],
        }

        for category, keywords in category_mapping.items():
            if any(keyword in tag_str for keyword in keywords):
                return category

        # Default to fullstack for generic "dev" tags
        if 'dev' in tag_str or 'engineer' in tag_str:
            return 'fullstack'

        return 'unknown'

    def _extract_region(self, item: Dict) -> str:
        """Extract region restriction from job data"""
        location = item.get('location', '').lower()

        if not location or location in ['worldwide', 'anywhere', 'remote']:
            return 'worldwide'
        elif any(region in location for region in ['usa', 'us only', 'united states', 'america']):
            return 'regional'
        elif any(region in location for region in ['europe', 'eu only', 'uk']):
            return 'regional'
        elif 'timezone' in location or 'utc' in location:
            return 'timezone'

        return 'worldwide'

    def _parse_salary(self, salary_value) -> int:
        """Parse salary value to integer"""
        if not salary_value:
            return None
        try:
            return int(salary_value)
        except (ValueError, TypeError):
            return None
