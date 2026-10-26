"""
Job retention rules

The database only keeps jobs posted within MAX_JOB_AGE_DAYS (see
cleanup_jobs.py). Scrapers skip older jobs too, so a job removed by the
cleanup is not re-inserted (and re-classified) on the next scrape.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union

MAX_JOB_AGE_DAYS = 90


def _to_utc(value: Union[str, datetime, None]) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value


def is_past_retention(date_posted: Union[str, datetime, None]) -> bool:
    """True when the job was posted more than MAX_JOB_AGE_DAYS ago. Unknown dates are kept."""
    posted = _to_utc(date_posted)
    if posted is None:
        return False
    return posted < datetime.now(timezone.utc) - timedelta(days=MAX_JOB_AGE_DAYS)
