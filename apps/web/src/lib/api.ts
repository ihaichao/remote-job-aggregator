// Client-side API base (goes through nginx/browser)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Server-side API base (direct internal Docker network call)
// In Docker, backend is accessible at http://backend:4000/api
const SERVER_API_BASE = process.env.INTERNAL_API_URL || 'http://backend:4000/api';

export interface JobAiAnalysis {
  summary: string;
  fitForChina: string;
  highlights: string[];
  techStack: string[];
  englishLevel?: string;
  timezoneHint?: string;
  salaryHint?: string;
}

export interface Job {
  aiAnalysis?: JobAiAnalysis | null;
  aiAnalyzedAt?: string | null;
  id: number;
  title: string;
  company?: string;
  category: string[];
  tags: string[];
  regionLimit: string;
  workType: string;
  sourceSite: string;
  originalUrl: string;
  applyUrl?: string;
  description?: string;
  datePosted?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobFilters {
  category?: string;
  regionLimit?: string;
  workType?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobsResponse {
  data: Job[];
  pagination: Pagination;
}

// Site-wide counts from GET /api/jobs/stats; not affected by filters
export interface JobStats {
  total: number;
  categories: Record<string, number>;
  regions: Record<string, number>;
  workTypes: Record<string, number>;
  lastSyncedAt: string | null;
}

export const EMPTY_STATS: JobStats = { total: 0, categories: {}, regions: {}, workTypes: {}, lastSyncedAt: null };

// Client-side fetch (used in 'use client' components)
export async function getJobs(filters?: JobFilters): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.regionLimit) params.append('regionLimit', filters.regionLimit);
  if (filters?.workType) params.append('workType', filters.workType);
  if (filters?.keyword) params.append('keyword', filters.keyword);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `${API_BASE}/jobs${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return res.json();
}

// Server-side fetch (used in Server Components for SSR)
export async function getServerJobs(filters?: JobFilters, revalidate?: number): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.regionLimit) params.append('regionLimit', filters.regionLimit);
  if (filters?.workType) params.append('workType', filters.workType);
  if (filters?.keyword) params.append('keyword', filters.keyword);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `${SERVER_API_BASE}/jobs${params.toString() ? `?${params}` : ''}`;
  
  try {
    const res = await fetch(url, revalidate === undefined ? { cache: 'no-store' } : { next: { revalidate } });

    if (!res.ok) {
      console.error(`Server fetch failed: ${res.status} ${res.statusText}`);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    return await res.json();
  } catch (error) {
    console.error('SSR fetch error:', error);
    // Return empty response on error to avoid breaking SSR
    return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
}

// Server-side fetch for a single job; returns null when missing or on error
export async function getServerJob(id: number): Promise<Job | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/jobs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('SSR fetch job error:', error);
    return null;
  }
}

// Whether a job has a real description, not just an echo of its title.
export function hasSubstantiveDescription(job: Job): boolean {
  const desc = job.description?.trim() ?? '';
  return desc.length >= 80 && desc !== job.title.trim();
}

export async function getJob(id: number): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Failed to fetch job');
  }

  return res.json();
}

// Server-side stats fetch; returns EMPTY_STATS on any failure so the page still renders
export async function getServerJobStats(): Promise<JobStats> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/jobs/stats`, { next: { revalidate: 300 } });
    if (!res.ok) return EMPTY_STATS;
    return await res.json();
  } catch (error) {
    console.error('SSR fetch stats error:', error);
    return EMPTY_STATS;
  }
}

export async function getJobStats(): Promise<JobStats> {
  const res = await fetch(`${API_BASE}/jobs/stats`);
  if (!res.ok) throw new Error('Failed to fetch job stats');
  return res.json();
}

export function hasCuratedAnalysis(job: Job): job is Job & { aiAnalysis: JobAiAnalysis } {
  const a = job.aiAnalysis;
  return !!a && typeof a.summary === 'string' && a.summary.trim().length >= 30
    && typeof a.fitForChina === 'string' && a.fitForChina.trim().length >= 20
    && Array.isArray(a.highlights) && a.highlights.length >= 2
    && a.highlights.every(item => typeof item === 'string' && item.trim().length > 0)
    && Array.isArray(a.techStack) && a.techStack.every(item => typeof item === 'string')
    && [a.englishLevel, a.timezoneHint, a.salaryHint].every(item => item == null || typeof item === 'string');
}

export function displayCompany(company?: string | null) {
  return company?.trim().toLowerCase() === 'unknown' ? '' : company?.trim() || '';
}

export async function getServerRelatedJobs(id: number): Promise<Job[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/jobs/${id}/related`, { cache: 'no-store' });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

export interface JobInsights extends JobStats {
  sources: Record<string, number>;
  analyzedCount: number;
  topTags: { tag: string; count: number }[];
  recentTrend: { label: string; count: number }[];
}

export async function getServerJobInsights(): Promise<JobInsights | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/jobs/insights`, { next: { revalidate: 300 } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
