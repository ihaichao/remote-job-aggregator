'use client';

import { Job } from '@/lib/api';
import { CATEGORY_LABELS, WORK_TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock } from 'lucide-react';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const timeAgo = getTimeAgo(job.datePosted || job.createdAt);

  return (
    <a
      href={job.applyUrl || job.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-accent/30 hover:-translate-y-0.5"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start gap-2">
            <h3 className="text-lg text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
              {job.title}
            </h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
          </div>

          {/* Category badges */}
          {job.category && job.category.length > 0 && !(job.category.length === 1 && job.category[0] === 'other') && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.category.map((cat) => (
                <Badge key={cat} variant="category" className="text-xs px-2 py-0.5">
                  {CATEGORY_LABELS[cat] || cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.tags.slice(0, 5).map((tag, index) => (
                <Badge key={index} variant="tag" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-2">
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

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} 天前`;

  return date.toLocaleDateString('zh-CN');
}
