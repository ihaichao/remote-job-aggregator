"""
Batch reclassify all existing jobs using AI.

Reads all jobs from the database, classifies each one using AIClassifier,
and updates the category field. Supports resuming from where it left off.

Usage:
    python reclassify_jobs.py          # only reclassify unknown/other
    python reclassify_jobs.py --all    # reclassify ALL jobs
"""

import os
import sys
import asyncio
import logging
import psycopg2
from utils.ai_classifier import AIClassifier

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


async def reclassify_all(force_all: bool = False):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL environment variable is required")
        return

    classifier = AIClassifier()
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, title, description, category
            FROM jobs
            ORDER BY id
        """)
        rows = cursor.fetchall()
        total = len(rows)
        logger.info(f"Found {total} jobs to process (mode: {'ALL' if force_all else 'unknown/other only'})")

        updated = 0
        skipped = 0

        for i, (job_id, title, description, category) in enumerate(rows):
            if not force_all:
                # Skip if already reclassified with multiple categories
                if isinstance(category, list) and len(category) > 1:
                    skipped += 1
                    continue

                # Skip if already a valid single-category array that isn't 'unknown'/'other'
                if isinstance(category, list) and len(category) == 1 and category[0] not in ('unknown', 'other'):
                    skipped += 1
                    continue

            try:
                new_category = await classifier.classify_category(
                    title or "", description or ""
                )

                cursor.execute(
                    "UPDATE jobs SET category = %s, updated_at = NOW() WHERE id = %s",
                    (new_category, job_id),
                )
                conn.commit()
                updated += 1

                if (i + 1) % 50 == 0:
                    logger.info(
                        f"Progress: {i + 1}/{total} "
                        f"(updated: {updated}, skipped: {skipped})"
                    )

            except Exception as e:
                logger.error(f"Error processing job {job_id}: {e}")
                conn.rollback()
                continue

        logger.info(
            f"Done! Total: {total}, Updated: {updated}, Skipped: {skipped}"
        )

    finally:
        await classifier.close()
        cursor.close()
        conn.close()


if __name__ == "__main__":
    force_all = "--all" in sys.argv
    asyncio.run(reclassify_all(force_all=force_all))
