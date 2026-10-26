#!/usr/bin/env python3
"""
Job Cleanup

Deletes jobs that are no longer worth keeping:
  - inactive jobs (marked expired/deleted by check_jobs.py)
  - jobs posted more than MAX_JOB_AGE_DAYS ago

Runs weekly from cron, after the daily check_jobs.py pass.

Usage:
  python cleanup_jobs.py              # Delete matching jobs
  python cleanup_jobs.py --dry-run    # Only show what would be deleted
"""

import argparse
import os
import sys

import psycopg2
from dotenv import load_dotenv

from utils.retention import MAX_JOB_AGE_DAYS

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

if not os.getenv('DATABASE_URL') and os.getenv('POSTGRES_PASSWORD'):
    os.environ['DATABASE_URL'] = f"postgresql://postgres:{os.getenv('POSTGRES_PASSWORD')}@localhost:5432/remote_jobs"

# A job is removed when it is inactive, or when its post date is past retention.
# Jobs without date_posted fall back to when they were scraped.
CLEANUP_WHERE = """
    is_active = FALSE
    OR COALESCE(date_posted, created_at) < NOW() - make_interval(days => %s)
"""


def main():
    parser = argparse.ArgumentParser(description='Delete inactive and old jobs')
    parser.add_argument('--dry-run', action='store_true', help='Show counts without deleting')
    args = parser.parse_args()

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM jobs")
    total = cursor.fetchone()[0]

    cursor.execute(f"""
        SELECT source_site,
               COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive,
               COUNT(*) FILTER (WHERE is_active = TRUE) AS too_old
        FROM jobs
        WHERE {CLEANUP_WHERE}
        GROUP BY source_site
        ORDER BY source_site
    """, (MAX_JOB_AGE_DAYS,))
    rows = cursor.fetchall()
    to_delete = sum(inactive + too_old for _, inactive, too_old in rows)

    print(f"Jobs in database: {total}")
    print(f"To delete: {to_delete} (inactive, or posted more than {MAX_JOB_AGE_DAYS} days ago)")
    for source, inactive, too_old in rows:
        print(f"  {source}: {inactive} inactive, {too_old} too old")

    if args.dry_run or to_delete == 0:
        if args.dry_run:
            print("[DRY RUN] Nothing deleted")
        cursor.close()
        conn.close()
        return

    cursor.execute(f"DELETE FROM jobs WHERE {CLEANUP_WHERE}", (MAX_JOB_AGE_DAYS,))
    deleted = cursor.rowcount
    conn.commit()
    print(f"Deleted {deleted} jobs; {total - deleted} remain")

    cursor.close()
    conn.close()


if __name__ == '__main__':
    main()
