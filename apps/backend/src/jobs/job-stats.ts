export interface JobStats {
  total: number;
  categories: Record<string, number>; // excludes 'other'
  regions: Record<string, number>; // only the options the UI offers
  workTypes: Record<string, number>;
  lastSyncedAt: string | null;
}
