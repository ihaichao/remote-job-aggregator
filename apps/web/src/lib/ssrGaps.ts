import { JobStats } from './api';

// Server fetches fall back to empty data instead of failing the page, which
// looks the same as "no results". The client fetches again whatever came back
// empty; for a filter that truly has no jobs that costs one extra request.
export function ssrGaps(jobCount: number, stats: JobStats): { jobs: boolean; stats: boolean } {
  return { jobs: jobCount === 0, stats: !stats.total };
}
