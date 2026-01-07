#!/usr/bin/env python3
"""
Migration script to update regionLimit values in the database.
Re-extracts region from title and description using the new extraction logic.

Usage: python migrate_region_limit.py
"""

import os
import re
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def extract_region(text: str) -> str:
    """Extract specific region/timezone restriction from text"""
    if not text:
        return 'worldwide'
    
    text_lower = text.lower()

    # Check for specific country/region mentions
    # United States
    if any(word in text_lower for word in ['usa', 'us only', 'united states', 'america only', '美国']):
        return 'US'
    
    # Europe
    if any(word in text_lower for word in ['europe', 'eu only', 'european', 'uk only', 'emea', '欧洲']):
        return 'EU'
    
    # China
    if any(word in text_lower for word in ['国内', '仅限中国', '中国地区', '大陆', 'china only']):
        return 'CN'
    
    # Asia-Pacific (use word boundary to avoid matching 'Apache')
    if re.search(r'\b(asia|apac|asia-pacific)\b', text_lower) or '亚太' in text_lower or 'southeast asia' in text_lower:
        return 'APAC'
    
    # Check for timezone patterns
    tz_pattern = r'(utc|gmt)\s*([+-]\d{1,2})'
    tz_match = re.search(tz_pattern, text_lower)
    if tz_match:
        offset = tz_match.group(2)
        return f'UTC{offset}'
    
    # Named timezones
    if 'pst' in text_lower or 'pacific time' in text_lower:
        return 'UTC-8'
    if 'est' in text_lower or 'eastern time' in text_lower:
        return 'UTC-5'
    if 'cst' in text_lower and '中国' not in text_lower:
        return 'UTC-6'
    if '北京时间' in text_lower or '东八区' in text_lower:
        return 'UTC+8'

    return 'worldwide'


def migrate():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        return

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    # Get all jobs
    cursor.execute("SELECT id, title, description, region_limit FROM jobs")
    jobs = cursor.fetchall()

    print(f"Found {len(jobs)} jobs to check")

    updated = 0
    for job_id, title, description, current_region in jobs:
        # Combine title and description for analysis
        text = f"{title or ''} {description or ''}"
        new_region = extract_region(text)

        # Only update if different
        if new_region != current_region:
            cursor.execute(
                "UPDATE jobs SET region_limit = %s, updated_at = NOW() WHERE id = %s",
                (new_region, job_id)
            )
            updated += 1
            print(f"  [{job_id}] {current_region} -> {new_region}: {title[:50]}...")

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\nMigration complete: {updated} jobs updated")


if __name__ == '__main__':
    migrate()
