// Job 相关类型
export interface Job {
  id: number;
  title: string;
  company: string;
  companyLogo?: string;
  category: JobCategory;
  tags: string[];
  regionLimit: RegionLimit;
  locationDetail?: string;
  workType: WorkType;
  salaryCurrency?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: SalaryPeriod;
  sourceSite: string;
  originalUrl: string;
  description?: string;
  datePosted?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 岗位类型
export type JobCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'devops'
  | 'ai'
  | 'blockchain'
  | 'unknown';

// 地域限制
export type RegionLimit = 'worldwide' | 'regional' | 'timezone';

// 协作方式
export type WorkType = 'fulltime' | 'parttime' | 'contract';

// 薪资周期
export type SalaryPeriod = 'yearly' | 'monthly' | 'hourly';

// API 响应类型
export interface JobListResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
}

// 筛选参数
export interface JobFilters {
  category?: JobCategory;
  regionLimit?: RegionLimit;
  workType?: WorkType;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
