#!/usr/bin/env python3
"""
Remote Job Scraper - Main entry point

Usage:
  python main.py              # Run with database (requires DATABASE_URL)
  python main.py --test       # Run in test mode (no database required)
  python main.py --json       # Output results as JSON to stdout
"""

import asyncio
import argparse
import json
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

from scrapers import V2EXScraper, RemoteOKScraper

load_dotenv()


async def scrape_all():
    """Run all scrapers and collect jobs"""
    scrapers = [
        ('V2EX', V2EXScraper()),
        ('RemoteOK', RemoteOKScraper()),
    ]

    all_jobs = []

    for name, scraper in scrapers:
        print(f"Scraping {name}...", file=sys.stderr)
        try:
            jobs = await scraper.scrape()
            all_jobs.extend(jobs)
            print(f"  {name}: {len(jobs)} jobs found", file=sys.stderr)
        except Exception as e:
            print(f"  {name} failed: {e}", file=sys.stderr)

        # Delay between scrapers
        await asyncio.sleep(1)

    return all_jobs


async def run_with_database(jobs):
    """Save jobs to database"""
    from utils import DatabaseClient

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    db = DatabaseClient(database_url)

    inserted = 0
    for job in jobs:
        try:
            result = db.insert_job(job)
            if result:
                inserted += 1
        except Exception as e:
            print(f"Error inserting job: {e}", file=sys.stderr)

    db.close()

    print(f"\nInserted {inserted} new jobs (skipped {len(jobs) - inserted} duplicates)", file=sys.stderr)
    return inserted


async def main():
    parser = argparse.ArgumentParser(description='Remote Job Scraper')
    parser.add_argument('--test', action='store_true', help='Run in test mode (no database)')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')
    args = parser.parse_args()

    print(f"\n{'=' * 50}", file=sys.stderr)
    print(f"  Remote Job Scraper - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", file=sys.stderr)
    print(f"{'=' * 50}\n", file=sys.stderr)

    # Scrape all sources
    jobs = await scrape_all()

    print(f"\nTotal: {len(jobs)} jobs scraped", file=sys.stderr)

    if args.json:
        # Output as JSON
        print(json.dumps(jobs, ensure_ascii=False, indent=2, default=str))
    elif args.test:
        # Test mode - just print summary
        print("\n[Test Mode] Jobs scraped successfully. Use --json to see full output.", file=sys.stderr)

        # Show sample
        print("\nSample jobs:", file=sys.stderr)
        for job in jobs[:3]:
            print(f"  - [{job['source_site']}] {job['title']} @ {job['company']}", file=sys.stderr)
    else:
        # Production mode - save to database
        await run_with_database(jobs)


if __name__ == '__main__':
    asyncio.run(main())
