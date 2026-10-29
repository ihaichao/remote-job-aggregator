#!/usr/bin/env python3
"""
RWFA Company Fix

The RWFA scraper used to split the card text by position and stored the
posting time ("about 13", "28") as the company. This re-reads the company
from each job's detail page; jobs whose page is gone or names no company
get NULL, which the site shows as no company.

Usage:
  python fix_rwfa_companies.py            # Fix all RWFA jobs
  python fix_rwfa_companies.py --dry-run  # Preview without updating DB
"""

import argparse
import asyncio
import os
import sys
from typing import Optional

import httpx
import psycopg2
from dotenv import load_dotenv

from utils.job_details import extract_rwfa_company

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

if not os.getenv('DATABASE_URL') and os.getenv('POSTGRES_PASSWORD'):
    os.environ['DATABASE_URL'] = f"postgresql://postgres:{os.getenv('POSTGRES_PASSWORD')}@localhost:5432/remote_jobs"

# Keep the load on the source site low
MAX_CONCURRENT = 3
MAX_ATTEMPTS = 3
RETRY_STATUS = {429, 500, 502, 503, 504}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


async def fetch_company(client: httpx.AsyncClient, url: str) -> Optional[str]:
    """Company from the detail page; None when the page is gone or names none. Other HTTP errors are raised."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = await client.get(url)
            if response.status_code in (404, 410):
                return None
            response.raise_for_status()
            return extract_rwfa_company(response.text)
        except httpx.HTTPStatusError as e:
            if e.response.status_code not in RETRY_STATUS or attempt == MAX_ATTEMPTS:
                raise
        except httpx.TransportError:
            if attempt == MAX_ATTEMPTS:
                raise
        await asyncio.sleep(2 ** attempt)


async def main():
    parser = argparse.ArgumentParser(description='Fix RWFA company names')
    parser.add_argument('--dry-run', action='store_true', help='Preview without updating DB')
    args = parser.parse_args()

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    cursor.execute("SELECT id, original_url, company FROM jobs WHERE source_site = 'rwfa' ORDER BY id")
    rows = cursor.fetchall()
    print(f"Checking {len(rows)} RWFA jobs{' (dry run)' if args.dry_run else ''}")

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    stats = {'fixed': 0, 'cleared': 0, 'unchanged': 0, 'failed': 0}

    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
        async def process(job_id: int, url: str, old: Optional[str]):
            async with semaphore:
                try:
                    new = await fetch_company(client, url)
                except Exception as e:
                    print(f"  [{job_id}] failed: {type(e).__name__}: {e} for {url}")
                    stats['failed'] += 1
                    return
                finally:
                    await asyncio.sleep(0.5)

            if new == old:
                stats['unchanged'] += 1
                return

            print(f"  [{job_id}] {old!r} -> {new!r}")
            stats['fixed' if new else 'cleared'] += 1
            if not args.dry_run:
                cursor.execute(
                    "UPDATE jobs SET company = %s, updated_at = NOW() WHERE id = %s",
                    (new, job_id),
                )
                conn.commit()

        await asyncio.gather(*(process(*row) for row in rows))

    cursor.close()
    conn.close()
    print(
        f"\nDone: {stats['fixed']} fixed, {stats['cleared']} cleared (no company found), "
        f"{stats['unchanged']} unchanged, {stats['failed']} failed"
    )


if __name__ == '__main__':
    asyncio.run(main())
