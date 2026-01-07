'use client';

import { Job } from '@/lib/api';
import { CATEGORY_LABELS, getRegionLabel, WORK_TYPE_LABELS, SOURCE_LABELS } from '@/lib/constants';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const timeAgo = getTimeAgo(job.datePosted || job.createdAt);

  return (
    <a
      href={job.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {job.title}
          </h3>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {CATEGORY_LABELS[job.category] || job.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {getRegionLabel(job.regionLimit)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {WORK_TYPE_LABELS[job.workType] || job.workType}
            </span>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.tags.slice(0, 5).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end text-sm text-gray-500 shrink-0">
          <span className="font-medium text-gray-700">
            {SOURCE_LABELS[job.sourceSite] || job.sourceSite}
          </span>
          <span className="mt-1">{timeAgo}</span>
        </div>
      </div>

      {job.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {job.description.slice(0, 200)}...
        </p>
      )}
    </a>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
