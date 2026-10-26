#!/usr/bin/env python3
"""
Description Backfill

Re-fetches full job descriptions for jobs scraped before the scrapers
started reading detail pages (Eleduck summaries, RWFA card text and
Remote.com title placeholders), and stores them as Markdown.

Usage:
  python backfill_descriptions.py                    # Backfill all active jobs
  python backfill_descriptions.py --dry-run          # Preview without updating DB
  python backfill_descriptions.py --source remotecom # Only one source
  python backfill_descriptions.py --limit 20         # Only the 20 newest jobs
"""

import argparse
import asyncio
import os
import sys
from typing import Optional

import httpx
import psycopg2
from dotenv import load_dotenv

from utils.job_details import (
    ELEDUCK_POST_API,
    extract_remotecom_description,
    extract_rwfa_description,
    parse_eleduck_post,
)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

if not os.getenv('DATABASE_URL') and os.getenv('POSTGRES_PASSWORD'):
    os.environ['DATABASE_URL'] = f"postgresql://postgres:{os.getenv('POSTGRES_PASSWORD')}@localhost:5432/remote_jobs"

# V2EX already stores the full topic body, so it is not listed here
SOURCES = ['eleduck', 'rwfa', 'remotecom']

# Keep the load on source sites low
MAX_CONCURRENT = 3

# Retry connection resets, throttling and server errors
MAX_ATTEMPTS = 3
RETRY_STATUS = {429, 500, 502, 503, 504}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


async def fetch_description(client: httpx.AsyncClient, source_site: str, url: str) -> Optional[str]:
    """Fetch and parse one job's description; HTTP errors are raised so the caller can report them."""
    if source_site == 'eleduck':
        post_id = url.rstrip('/').split('/')[-1]
        response = await client.get(ELEDUCK_POST_API.format(post_id=post_id))
        response.raise_for_status()
        return parse_eleduck_post(response.json())

    response = await client.get(url)
    response.raise_for_status()
    if source_site == 'rwfa':
        return extract_rwfa_description(response.text)
    return extract_remotecom_description(response.text)


async def fetch_with_retry(client: httpx.AsyncClient, source_site: str, url: str) -> Optional[str]:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return await fetch_description(client, source_site, url)
        except httpx.HTTPStatusError as e:
            if e.response.status_code not in RETRY_STATUS or attempt == MAX_ATTEMPTS:
                raise
        except httpx.TransportError:
            if attempt == MAX_ATTEMPTS:
                raise
        await asyncio.sleep(2 ** attempt)


async def main():
    parser = argparse.ArgumentParser(description='Backfill full job descriptions')
    parser.add_argument('--dry-run', action='store_true', help='Preview without updating DB')
    parser.add_argument('--source', choices=SOURCES, help='Only backfill jobs from this source site')
    parser.add_argument('--limit', type=int, help='Only process the N most recent jobs')
    args = parser.parse_args()

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    sources = [args.source] if args.source else SOURCES
    query = """
        SELECT id, source_site, original_url, COALESCE(description, '')
        FROM jobs
        WHERE is_active = TRUE AND source_site = ANY(%s)
        ORDER BY date_posted DESC NULLS LAST
    """
    params = [sources]
    if args.limit:
        query += " LIMIT %s"
        params.append(args.limit)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    print(f"Backfilling {len(rows)} jobs from {', '.join(sources)}{' (dry run)' if args.dry_run else ''}")

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    stats = {'updated': 0, 'unchanged': 0, 'skipped': 0, 'gone': 0, 'failed': 0}

    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
        async def process(job_id: int, source_site: str, url: str, old: str):
            if source_site == 'remotecom' and '?jobId=' in url:
                stats['skipped'] += 1  # No detail page for listing-only jobs
                return

            async with semaphore:
                try:
                    new = await fetch_with_retry(client, source_site, url)
                except httpx.HTTPStatusError as e:
                    if e.response.status_code in (404, 410):
                        # Deleted at the source; check_jobs.py marks these inactive
                        stats['gone'] += 1
                        return
                    print(f"  [{job_id}] {source_site} failed: HTTP {e.response.status_code} for {url}")
                    stats['failed'] += 1
                    return
                except Exception as e:
                    print(f"  [{job_id}] {source_site} failed: {type(e).__name__}: {e} for {url}")
                    stats['failed'] += 1
                    return
                finally:
                    await asyncio.sleep(0.5)

            if not new:
                print(f"  [{job_id}] {source_site} failed: no description found in response for {url}")
                stats['failed'] += 1
                return

            # Only replace when the fetched text is a real improvement
            if len(new) <= len(old.strip()):
                stats['unchanged'] += 1
                return

            print(f"  [{job_id}] {source_site}: {len(old)} -> {len(new)} chars")
            stats['updated'] += 1
            if not args.dry_run:
                cursor.execute(
                    "UPDATE jobs SET description = %s, updated_at = NOW() WHERE id = %s",
                    (new, job_id),
                )
                conn.commit()

        await asyncio.gather(*(process(*row) for row in rows))

    cursor.close()
    conn.close()
    print(
        f"\nDone: {stats['updated']} updated, {stats['unchanged']} unchanged, "
        f"{stats['skipped']} skipped (no detail page), "
        f"{stats['gone']} gone (deleted at source), {stats['failed']} failed"
    )
    if stats['gone']:
        print("Run `python check_jobs.py` to hide the deleted jobs from the site.")


if __name__ == '__main__':
    asyncio.run(main())
