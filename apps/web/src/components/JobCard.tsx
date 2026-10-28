import Link from 'next/link';
import { Job } from '@/lib/api';
import { JOB_CATEGORY_LABELS, SOURCE_LABELS, WORK_TYPE_LABELS, getRegionLabel } from '@/lib/constants';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/lib/categoryMeta';
import { displayCompany } from '@/lib/jobDisplay';
import { formatTimeAgo, isFresh } from '@/lib/time';
import { markdownToPlainText } from '@/lib/utils';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const posted = job.datePosted || job.createdAt;
  const fresh = isFresh(posted);
  const categories = job.category.filter((c) => JOB_CATEGORY_LABELS[c]);
  const icon = CATEGORY_META[categories[0]] ?? DEFAULT_CATEGORY_META;
  const company = displayCompany(job.company);
  const description = job.description ? markdownToPlainText(job.description) : '';
  const location = [getRegionLabel(job.regionLimit), WORK_TYPE_LABELS[job.workType] ?? job.workType]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-[18px] gap-y-3 rounded-[18px] border border-line bg-white p-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_4px_0_#0a0a0a] min-[860px]:grid-cols-[56px_minmax(0,1fr)_auto] min-[860px]:p-[22px]"
    >
      <div
        className="grid h-11 w-11 place-items-center rounded-[14px] text-xl min-[860px]:h-14 min-[860px]:w-14 min-[860px]:text-[26px]"
        style={{ background: icon.tint }}
        aria-hidden
      >
        {icon.emoji}
      </div>

      <div className="min-w-0">
        <h3 className="text-lg font-bold leading-[24.75px] text-ink">{job.title}</h3>
        {company && <div className="mt-0.5 text-base font-medium leading-6 text-ink">{company}</div>}
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">{description}</p>
        )}
        <div className="mt-2.5 text-xs font-medium uppercase leading-4 tracking-[0.02em] text-muted-foreground">
          {location}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-[7px] px-[9px] py-1 text-xs font-medium text-ink"
              style={{ background: (CATEGORY_META[c] ?? DEFAULT_CATEGORY_META).tint }}
            >
              {JOB_CATEGORY_LABELS[c]}
            </span>
          ))}
          {job.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-[7px] border border-line px-[9px] py-1 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="col-start-2 flex items-center justify-between gap-2.5 min-[860px]:col-start-3 min-[860px]:flex-col min-[860px]:items-end">
        <span
          className={`whitespace-nowrap text-xs ${fresh ? 'font-medium text-[#15803d]' : 'text-muted-foreground'}`}
          suppressHydrationWarning
        >
          {fresh && '● '}
          {formatTimeAgo(posted)}
        </span>
        <span className="min-w-0 truncate rounded-[7px] bg-[#f7f1eb] px-2 py-1 text-xs text-muted-foreground">
          via {SOURCE_LABELS[job.sourceSite] ?? job.sourceSite}
        </span>
      </div>
    </Link>
  );
}
