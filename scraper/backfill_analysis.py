"""Generate Chinese analyses for existing active postings."""
import argparse
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from utils.ai_classifier import AIClassifier
from utils.database import DatabaseClient


async def backfill(args):
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    db = DatabaseClient(os.environ["DATABASE_URL"])
    classifier = AIClassifier()
    updated = 0
    try:
        jobs = db.get_jobs_needing_analysis(args.limit, args.force)
        for job in jobs:
            job_id = job.pop("id")
            if args.dry_run:
                print(job_id, job["title"])
                continue
            analysis = await classifier.analyze_job(**job)
            if analysis:
                updated += db.update_job_analysis(job_id, analysis)
            else:
                print(f"No valid analysis for job {job_id}")
        print(f"Selected {len(jobs)} jobs, updated {updated}")
    finally:
        await classifier.close()
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--force", action="store_true", help="Include previously analyzed jobs")
    parser.add_argument("--dry-run", action="store_true", help="List candidates without LLM calls or writes")
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be positive")
    asyncio.run(backfill(args))
