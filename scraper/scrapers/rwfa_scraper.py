"""
RealWorkFromAnywhere Scraper

Scrapes remote job listings from realworkfromanywhere.com
All jobs on this site are 100% remote worldwide.
"""

import re
import httpx
from typing import List, Dict
from datetime import datetime, timedelta
from bs4 import BeautifulSoup


class RWFAScraper:
    """Scraper for realworkfromanywhere.com"""
    
    BASE_URL = "https://www.realworkfromanywhere.com"
    ENGINEER_JOBS_PATH = "/remote-engineer-jobs"
    MAX_PAGES = 15  # Scrape all 15 pages
    
    async def scrape(self) -> List[Dict]:
        """Fetch remote engineer jobs from RWFA"""
        import asyncio
        all_jobs = []
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for page in range(1, self.MAX_PAGES + 1):
                try:
                    # Pagination: /remote-engineer-jobs/page/N for page > 1
                    if page == 1:
                        url = f"{self.BASE_URL}{self.ENGINEER_JOBS_PATH}"
                    else:
                        url = f"{self.BASE_URL}{self.ENGINEER_JOBS_PATH}/page/{page}"
                    
                    response = await client.get(url)
                    response.raise_for_status()
                    
                    jobs = self._parse_page(response.text)
                    if not jobs:
                        break
                        
                    all_jobs.extend(jobs)
                    
                    # Rate limiting
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"  RWFA page {page} error: {e}")
                    break
        
        return all_jobs
    
    def _parse_page(self, html: str) -> List[Dict]:
        """Parse job listings from HTML page"""
        jobs = []
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find all job cards - they are anchor tags with job links
        job_links = soup.find_all('a', href=re.compile(r'/jobs/'))
        
        seen_urls = set()
        for link in job_links:
            href = link.get('href', '')
            if not href or href in seen_urls:
                continue
            
            # Skip if it's just a company link or similar
            if '/companies/' in href:
                continue
                
            full_url = f"{self.BASE_URL}{href}" if href.startswith('/') else href
            seen_urls.add(href)
            
            # Extract job info from the card
            job = self._parse_job_card(link, full_url)
            if job:
                jobs.append(job)
        
        return jobs
    
    def _parse_job_card(self, card, url: str) -> Dict:
        """Parse a single job card element"""
        # Get text content
        text = card.get_text(separator=' ', strip=True)
        
        # Extract title from the first meaningful text
        # The format is usually: "TitleCompanyTimeLocation..."
        # Try to find h3 or similar structure
        title_elem = card.find(['h3', 'h4', 'strong'])
        if title_elem:
            title = title_elem.get_text(strip=True)
        else:
            # Fallback: take first part of text
            title = text.split()[0:10]
            title = ' '.join(title)
        
        if not title or len(title) < 5:
            return None
            
        # Skip non-dev jobs
        if not self._is_dev_job(title, text):
            return None
        
        # Extract company - usually follows title
        company = self._extract_company(text, title)
        
        # Extract date posted from relative time strings
        date_posted = self._extract_date(text)
        
        # Generate source_id from URL
        source_id = url.split('/')[-1] if '/' in url else url
        
        return {
            'source_id': f"rwfa-{source_id}",
            'title': title[:255],
            'company': company[:255] if company else 'Unknown',
            'category': self._extract_category(title, text),
            'region_limit': 'worldwide',  # All RWFA jobs are worldwide
            'work_type': 'fulltime',  # Default to fulltime
            'source_site': 'rwfa',
            'original_url': url,
            'description': text[:2000],  # First 2000 chars as description
            'date_posted': date_posted,
        }
    
    def _extract_date(self, text: str) -> str:
        """Extract and parse relative date from text like '2 days ago', 'about 17 hours ago'"""
        text_lower = text.lower()
        now = datetime.utcnow()
        
        # Match patterns like "about 17 hours ago", "2 days ago", "2 months ago"
        hour_match = re.search(r'(\d+)\s*hours?\s*ago', text_lower)
        day_match = re.search(r'(\d+)\s*days?\s*ago', text_lower)
        week_match = re.search(r'(\d+)\s*weeks?\s*ago', text_lower)
        month_match = re.search(r'(\d+)\s*months?\s*ago', text_lower)
        
        if hour_match:
            hours = int(hour_match.group(1))
            return (now - timedelta(hours=hours)).isoformat()
        elif day_match:
            days = int(day_match.group(1))
            return (now - timedelta(days=days)).isoformat()
        elif week_match:
            weeks = int(week_match.group(1))
            return (now - timedelta(weeks=weeks)).isoformat()
        elif month_match:
            months = int(month_match.group(1))
            return (now - timedelta(days=months * 30)).isoformat()  # Approximate
        
        # Default to current time if no match
        return now.isoformat()
    
    def _extract_company(self, text: str, title: str) -> str:
        """Try to extract company name from text"""
        # Remove title from text to find what follows
        remaining = text.replace(title, '', 1).strip()
        
        # Company is usually the first word/phrase after title
        words = remaining.split()
        if words:
            # Take first 1-3 words as company (before time indicators)
            company_words = []
            for word in words[:5]:
                if any(t in word.lower() for t in ['ago', 'hour', 'day', 'week', 'worldwide', '$']):
                    break
                company_words.append(word)
            if company_words:
                return ' '.join(company_words)
        
        return 'Unknown'
    
    def _is_dev_job(self, title: str, text: str) -> bool:
        """Check if job is development related"""
        combined = (title + ' ' + text).lower()
        
        dev_keywords = [
            'developer', 'engineer', 'programmer', 'architect',
            'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack',
            'software', 'web', 'mobile', 'ios', 'android',
            'python', 'java', 'javascript', 'react', 'node', 'typescript',
            'devops', 'sre', 'data', 'ml', 'ai', 'machine learning',
            'golang', 'rust', 'ruby', 'php', 'vue', 'angular',
        ]
        
        # Exclude non-dev roles
        exclude_keywords = [
            'sales', 'marketing', 'hr ', 'recruiter', 'customer service',
            'account executive', 'account manager', 'operations manager',
            'content writer', 'copywriter', 'social media',
        ]
        
        # Must have at least one dev keyword
        has_dev = any(kw in combined for kw in dev_keywords)
        
        # Must not have exclude keywords as primary role
        is_excluded = any(kw in title.lower() for kw in exclude_keywords)
        
        return has_dev and not is_excluded
    
    def _extract_category(self, title: str, text: str) -> str:
        """Extract job category from title"""
        combined = (title + ' ' + text).lower()
        
        if any(kw in combined for kw in ['frontend', 'front-end', 'react', 'vue', 'angular', 'css']):
            return 'frontend'
        if any(kw in combined for kw in ['backend', 'back-end', 'node', 'python', 'java', 'golang', 'ruby', 'php']):
            return 'backend'
        if any(kw in combined for kw in ['fullstack', 'full-stack', 'full stack']):
            return 'fullstack'
        if any(kw in combined for kw in ['mobile', 'ios', 'android', 'flutter', 'react native']):
            return 'mobile'
        if any(kw in combined for kw in ['devops', 'sre', 'infrastructure', 'cloud', 'kubernetes']):
            return 'devops'
        if any(kw in combined for kw in ['data', 'ml', 'machine learning', 'ai', 'artificial intelligence']):
            return 'ai'
        if any(kw in combined for kw in ['security', 'infosec', 'penetration']):
            return 'security'
        
        return 'unknown'
