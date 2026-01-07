'use client';

import { useState, useEffect } from 'react';
import { Job, Pagination, getJobs } from '@/lib/api';
import { JobCard } from './JobCard';
import { Filters } from './Filters';
import { Button } from '@/components/ui/button';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    regionLimit: '',
    workType: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);

      try {
        const response = await getJobs({
          category: filters.category || undefined,
          regionLimit: filters.regionLimit || undefined,
          workType: filters.workType || undefined,
          page,
          limit: 10,
        });
        setJobs(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError('Failed to load jobs. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filters, page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) setPage(page + 1);
  };

  return (
    <div className="space-y-6">
      <Filters filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No jobs found. Try adjusting your filters.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, pagination?.total || 0)} of {pagination?.total} jobs
          </p>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

