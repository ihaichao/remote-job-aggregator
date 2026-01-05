#!/usr/bin/env python3
"""
Test script to verify scrapers work without database connection.
Usage: python test_scrapers.py
"""

import asyncio
import json
from scrapers import V2EXScraper, RemoteOKScraper


async def test_v2ex():
    """Test V2EX scraper"""
    print("=" * 60)
    print("Testing V2EX Scraper...")
    print("=" * 60)

    scraper = V2EXScraper()
    jobs = await scraper.scrape()

    print(f"Found {len(jobs)} remote jobs from V2EX\n")

    for i, job in enumerate(jobs[:5], 1):  # Show first 5 jobs
        print(f"[{i}] {job['title']}")
        print(f"    Company: {job['company']}")
        print(f"    Category: {job['category']}")
        print(f"    Region: {job['region_limit']}")
        print(f"    Type: {job['work_type']}")
        print(f"    URL: {job['original_url']}")
        print()

    return jobs


async def test_remoteok():
    """Test RemoteOK scraper"""
    print("=" * 60)
    print("Testing RemoteOK Scraper...")
    print("=" * 60)

    scraper = RemoteOKScraper()
    jobs = await scraper.scrape()

    print(f"Found {len(jobs)} jobs from RemoteOK\n")

    for i, job in enumerate(jobs[:5], 1):  # Show first 5 jobs
        print(f"[{i}] {job['title']}")
        print(f"    Company: {job['company']}")
        print(f"    Category: {job['category']}")
        print(f"    Region: {job['region_limit']}")
        print(f"    Tags: {', '.join(job.get('tags', [])[:5])}")
        print(f"    URL: {job['original_url']}")
        if job.get('salary_min') and job.get('salary_max'):
            print(f"    Salary: ${job['salary_min']:,} - ${job['salary_max']:,}")
        print()

    return jobs


async def main():
    print("\n" + "=" * 60)
    print("  Remote Job Scraper - Test Mode")
    print("=" * 60 + "\n")

    all_jobs = []

    # Test V2EX
    try:
        v2ex_jobs = await test_v2ex()
        all_jobs.extend(v2ex_jobs)
    except Exception as e:
        print(f"V2EX scraper failed: {e}\n")

    # Add delay between scrapers
    await asyncio.sleep(1)

    # Test RemoteOK
    try:
        remoteok_jobs = await test_remoteok()
        all_jobs.extend(remoteok_jobs)
    except Exception as e:
        print(f"RemoteOK scraper failed: {e}\n")

    # Summary
    print("=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"Total jobs scraped: {len(all_jobs)}")

    # Count by source
    sources = {}
    for job in all_jobs:
        source = job['source_site']
        sources[source] = sources.get(source, 0) + 1

    print("\nBy source:")
    for source, count in sources.items():
        print(f"  - {source}: {count}")

    # Count by category
    categories = {}
    for job in all_jobs:
        cat = job['category']
        categories[cat] = categories.get(cat, 0) + 1

    print("\nBy category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  - {cat}: {count}")

    # Save to JSON file for inspection
    output_file = 'test_output.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_jobs, f, ensure_ascii=False, indent=2, default=str)
    print(f"\nFull results saved to: {output_file}")


if __name__ == '__main__':
    asyncio.run(main())
