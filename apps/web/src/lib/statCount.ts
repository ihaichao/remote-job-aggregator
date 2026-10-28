import type { JobStats } from './api';

type CountGroup = 'categories' | 'regions' | 'workTypes';

// Count shown next to a filter option; '' is the "all" option. When stats are
// unavailable (total 0) no counts are shown rather than a misleading 0.
export function statCount(stats: JobStats, group: CountGroup, key: string): number | undefined {
  if (!stats.total) return undefined;
  return key ? stats[group][key] ?? 0 : stats.total;
}
