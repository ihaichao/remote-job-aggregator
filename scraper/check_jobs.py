#!/usr/bin/env python3
"""
Job Health Checker

Periodically checks all active jobs to see if their URLs are still valid.
Marks expired/deleted jobs as is_active = false.

Usage:
  python check_jobs.py              # Check all active jobs
  python check_jobs.py --dry-run    # Preview without updating DB
  python check_jobs.py --source eleduck  # Check only one source
"""

import asyncio
import argparse
import os
import sys
import re
from datetime import datetime

import httpx
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

if not os.getenv('DATABASE_URL') and os.getenv('POSTGRES_PASSWORD'):
    os.environ['DATABASE_URL'] = f"postgresql://postgres:{os.getenv('POSTGRES_PASSWORD')}@localhost:5432/remote_jobs"

# Concurrency limit for HTTP requests
MAX_CONCURRENT = 10


def is_job_expired(source_site: str, status_code: int, body: str) -> bool:
    """Determine if a job page indicates the posting is expired/deleted."""
    if status_code == 404:
        return True
    if status_code >= 500:
        # Server error — don't mark as expired, might be temporary
        return False
    if status_code >= 400:
        # 403, 410 Gone, etc.
        return True

    body_lower = body[:5000].lower()

    if source_site == 'eleduck':
        # Eleduck deleted posts return 404 (handled above)
        # Some may show error page
        if '页面不存在' in body or '帖子已删除' in body or '404' in body_lower:
            return True

    elif source_site == 'v2ex':
        if '主题未找到' in body or 'topic not found' in body_lower:
            return True
        # V2EX sometimes shows "该主题已被移除" or similar
        if '已被移除' in body or '已被删除' in body:
            return True

    elif source_site == 'rwfa':
        if '404' in body_lower and 'not found' in body_lower:
            return True
        if 'this job is no longer available' in body_lower:
            return True
        if 'page not found' in body_lower:
            return True

    elif source_site == 'remotecom':
        if 'this position has been filled' in body_lower:
            return True
        if 'job not found' in body_lower or 'no longer available' in body_lower:
            return True
        if 'page not found' in body_lower:
            return True

    # Common third-party job board patterns (Greenhouse, Lever, Ashby, etc.)
    # These are apply_url targets from RWFA/Remote.com
    if 'greenhouse.io' in body_lower:
        if '?error=true' in body_lower or 'the page you were looking for doesn' in body_lower:
            return True
    if 'no positions are open' in body_lower and 'lever.co' in body_lower:
        return True
    if 'this job is no longer available' in body_lower:
        return True
    if 'position has been closed' in body_lower or 'role has been filled' in body_lower:
        return True

    return False


async def check_job(client: httpx.AsyncClient, semaphore: asyncio.Semaphore,
                    job_id: int, source_site: str, url: str) -> dict:
    """Check a single job URL. Returns result dict."""
    async with semaphore:
        try:
            response = await client.get(url)
            # Check final URL after redirects (e.g. greenhouse ?error=true redirect)
            final_url = str(response.url)
            if 'error=true' in final_url or 'error=404' in final_url:
                return {
                    'id': job_id, 'url': url, 'source': source_site,
                    'status': f'{response.status_code}→redirect_error', 'expired': True,
                }
            expired = is_job_expired(source_site, response.status_code, response.text)
            return {
                'id': job_id,
                'url': url,
                'source': source_site,
                'status': response.status_code,
                'expired': expired,
            }
        except httpx.TimeoutException:
            return {'id': job_id, 'url': url, 'source': source_site, 'status': 'timeout', 'expired': False}
        except Exception as e:
            return {'id': job_id, 'url': url, 'source': source_site, 'status': str(e), 'expired': False}


async def main():
    parser = argparse.ArgumentParser(description='Job Health Checker')
    parser.add_argument('--dry-run', action='store_true', help='Preview without updating DB')
    parser.add_argument('--source', type=str, help='Only check jobs from this source site')
    args = parser.parse_args()

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    # Fetch all active jobs — check apply_url first (that's what users click),
    # fall back to original_url
    query = "SELECT id, source_site, COALESCE(apply_url, original_url) FROM jobs WHERE is_active = TRUE"
    params = []
    if args.source:
        query += " AND source_site = %s"
        params.append(args.source)
    query += " ORDER BY id"

    cursor.execute(query, params)
    jobs = cursor.fetchall()
    total = len(jobs)
    print(f"Checking {total} active jobs...", file=sys.stderr)

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    expired_ids = []

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=headers) as client:
        tasks = [
            check_job(client, semaphore, job_id, source, url)
            for job_id, source, url in jobs
        ]

        done = 0
        for coro in asyncio.as_completed(tasks):
            result = await coro
            done += 1

            if result['expired']:
                expired_ids.append(result['id'])
                print(f"  [{done}/{total}] EXPIRED: id={result['id']} status={result['status']} {result['url']}", file=sys.stderr)
            elif done % 50 == 0:
                print(f"  [{done}/{total}] checked...", file=sys.stderr)

    print(f"\nResults: {len(expired_ids)} expired out of {total} jobs", file=sys.stderr)

    if expired_ids and not args.dry_run:
        # Mark expired jobs as inactive
        cursor.execute(
            "UPDATE jobs SET is_active = FALSE, updated_at = %s WHERE id = ANY(%s)",
            (datetime.now(), expired_ids)
        )
        conn.commit()
        print(f"Marked {len(expired_ids)} jobs as inactive", file=sys.stderr)
    elif expired_ids and args.dry_run:
        print(f"[DRY RUN] Would mark {len(expired_ids)} jobs as inactive:", file=sys.stderr)
        for jid in expired_ids:
            print(f"  id={jid}", file=sys.stderr)

    cursor.close()
    conn.close()


if __name__ == '__main__':
    asyncio.run(main())
