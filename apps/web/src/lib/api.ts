// Client-side API base (goes through nginx/browser)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Server-side API base (direct internal Docker network call)
// In Docker, backend is accessible at http://backend:4000/api
const SERVER_API_BASE = process.env.INTERNAL_API_URL || 'http://backend:4000/api';

export interface Job {
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
export async function getServerJobs(filters?: JobFilters): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.regionLimit) params.append('regionLimit', filters.regionLimit);
  if (filters?.workType) params.append('workType', filters.workType);
  if (filters?.keyword) params.append('keyword', filters.keyword);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `${SERVER_API_BASE}/jobs${params.toString() ? `?${params}` : ''}`;
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Server fetch failed: ${res.status} ${res.statusText}`);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    return res.json();
  } catch (error) {
    console.error('SSR fetch error:', error);
    // Return empty response on error to avoid breaking SSR
    return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
}

export async function getJob(id: number): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Failed to fetch job');
  }

  return res.json();
}
