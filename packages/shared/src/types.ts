// Job types
export interface Job {
  id: number;
  title: string;
  category: JobCategory;
  tags: string[];
  regionLimit: RegionLimit;
  workType: WorkType;
  sourceSite: string;
  originalUrl: string;
  applyUrl?: string;
  description?: string;
  datePosted?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Job category
export type JobCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'devops'
  | 'ai'
  | 'blockchain'
  | 'unknown';

// Region restriction
export type RegionLimit = 'worldwide' | 'regional' | 'timezone';

// Work type
export type WorkType = 'fulltime' | 'parttime' | 'contract';

// API response types
export interface JobListResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
}

// Filter parameters
export interface JobFilters {
  category?: JobCategory;
  regionLimit?: RegionLimit;
  workType?: WorkType;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
