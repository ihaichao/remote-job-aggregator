import hashlib
import psycopg2
import re
from datetime import datetime, timedelta
from typing import Dict, Optional

class DatabaseClient:
    def __init__(self, connection_string: str):
        self.conn = psycopg2.connect(connection_string)
        self.cursor = self.conn.cursor()

    def insert_job(self, job_data: Dict) -> Optional[int]:
        """Insert job data, return job_id"""
        content_hash = self._generate_hash(job_data)

        # Check if already exists by content hash
        self.cursor.execute("SELECT id FROM jobs WHERE content_hash = %s", (content_hash,))
        if self.cursor.fetchone():
            return None

        # Check for similar job from same source within last 30 days
        if self._is_similar_exists(job_data):
            return None

        now = datetime.now()

        query = """
        INSERT INTO jobs (
            title, category, tags, region_limit, work_type,
            source_site, original_url, content_hash, description,
            date_posted, date_scraped, is_active, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """

        # Parse date_posted if it's a string
        date_posted = job_data.get('date_posted')
        if isinstance(date_posted, str):
            try:
                date_posted = datetime.fromisoformat(date_posted.replace('Z', '+00:00'))
            except:
                date_posted = now

        # Handle tags
        tags = job_data.get('tags', [])
        if not isinstance(tags, list):
            tags = []

        self.cursor.execute(query, (
            job_data['title'][:255],
            job_data.get('category', 'unknown')[:50],
            tags,
            job_data.get('region_limit', 'worldwide')[:50],
            job_data.get('work_type', 'fulltime')[:50],
            job_data['source_site'][:50],
            job_data['original_url'],
            content_hash,
            job_data.get('description', ''),
            date_posted,
            now,  # date_scraped
            True,  # is_active
            now,  # created_at
            now,  # updated_at
        ))

        self.conn.commit()
        return self.cursor.fetchone()[0]

    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison by removing whitespace and common variations"""
        if not text:
            return ''
        # Convert to lowercase
        text = text.lower()
        # Remove common prefix/suffix variations
        text = re.sub(r'[【\[（(].*?[】\]）)]', '', text)  # Remove bracketed content
        # Remove whitespace and punctuation
        text = re.sub(r'[\s\-_,，。、：:；;！!？?·.]+', '', text)
        # Remove common filler words
        text = re.sub(r'(高级|资深|senior|junior|初级)', '', text)
        return text

    def _generate_hash(self, job_data: Dict) -> str:
        """Generate content hash for deduplication"""
        # Normalize title and take first 200 chars of description
        title = self._normalize_text(job_data.get('title', ''))
        desc = self._normalize_text(job_data.get('description', ''))[:200]
        content = f"{title}{desc}"
        return hashlib.sha256(content.encode()).hexdigest()

    def _is_similar_exists(self, job_data: Dict) -> bool:
        """Check if a similar job already exists from the same source"""
        normalized_title = self._normalize_text(job_data.get('title', ''))
        if len(normalized_title) < 10:
            return False

        # Get recent jobs from same source
        cutoff_date = datetime.now() - timedelta(days=30)
        self.cursor.execute("""
            SELECT id, title FROM jobs 
            WHERE source_site = %s AND date_scraped > %s AND is_active = TRUE
        """, (job_data['source_site'], cutoff_date))

        for row in self.cursor.fetchall():
            existing_title = self._normalize_text(row[1])
            # Check if titles are very similar (share 80% of characters)
            if self._similarity(normalized_title, existing_title) > 0.8:
                return True

        return False

    def _similarity(self, s1: str, s2: str) -> float:
        """Calculate simple similarity ratio between two strings"""
        if not s1 or not s2:
            return 0.0
        # Use set-based similarity for efficiency
        set1, set2 = set(s1), set(s2)
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return intersection / union if union > 0 else 0.0

    def close(self):
        self.cursor.close()
        self.conn.close()

