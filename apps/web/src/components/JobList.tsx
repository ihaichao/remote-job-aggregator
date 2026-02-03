'use client';

import { useState, useEffect } from 'react';
import { Job, Pagination as PaginationType, getJobs } from '@/lib/api';
import { JobCard } from './JobCard';
import { Filters } from './Filters';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Loader2, Briefcase } from 'lucide-react';

function formatUpdateTime(dateString: string): string {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface JobListProps {
  initialJobs: Job[];
  initialPagination: PaginationType;
}

export function JobList({ initialJobs, initialPagination }: JobListProps) {
  // Use initial data from server for first render (SSR)
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [pagination, setPagination] = useState<PaginationType | null>(initialPagination);
  const [loading, setLoading] = useState(false); // Start false since we have initial data
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(() => {
    // Calculate initial update time from SSR data
    if (initialJobs.length > 0) {
      return initialJobs.reduce((latest, job) => {
        return job.updatedAt > latest ? job.updatedAt : latest;
      }, initialJobs[0].updatedAt);
    }
    return null;
  });
  const [filters, setFilters] = useState({
    category: '',
    workType: '',
    region: '',
  });
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(handle);
  }, [keyword]);

  useEffect(() => {
    // Skip fetch on initial load since we have SSR data
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    async function fetchJobs() {
      setLoading(true);
      setError(null);

      try {
        const response = await getJobs({
          category: filters.category || undefined,
          workType: filters.workType || undefined,
          regionLimit: filters.region || undefined,
          keyword: debouncedKeyword || undefined,
          page,
          limit: 10,
        });
        setJobs(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError('加载失败，请稍后重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filters.category, filters.workType, filters.region, debouncedKeyword, page, isInitialLoad]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'keyword') {
      setKeyword(value);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    
    const totalPages = pagination.totalPages;
    const current = page;
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      <Filters filters={{ ...filters, keyword }} onChange={handleFilterChange} />

      {error ? (
        <div className="text-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      ) : jobs.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">暂无相关职位</p>
            <p className="text-sm text-muted-foreground mt-1">请尝试调整筛选条件</p>
          </div>
        </div>
      ) : jobs.length === 0 && loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <p className="text-sm text-muted-foreground">正在加载职位...</p>
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`}>
          {/* Results count and update time */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              共 <span className="font-medium text-foreground">{pagination?.total}</span> 个职位
              <span className="mx-1.5">·</span>
              显示第 {(page - 1) * 10 + 1}-{Math.min(page * 10, pagination?.total || 0)} 个
              {loading && <Loader2 className="inline-block h-4 w-4 ml-2 animate-spin" />}
            </p>
            {lastUpdateTime && (
              <p className="text-xs text-muted-foreground">
                最近更新: {formatUpdateTime(lastUpdateTime)}
              </p>
            )}
          </div>

          {/* Job cards */}
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination className="pt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page - 1);
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((pageNum, idx) => (
                  <PaginationItem key={idx}>
                    {pageNum === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page + 1);
                    }}
                    className={page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
