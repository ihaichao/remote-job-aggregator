import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/lib/categoryMeta';
import { JOB_CATEGORY_LABELS } from '@/lib/constants';

interface JobTagsProps {
  categories: string[];
  tags: string[];
  className?: string;
}

// Tinted category chips followed by outlined tech tags; shared by the card and the detail page
export function JobTags({ categories, tags, className = '' }: JobTagsProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {categories.map((c) => (
        <span
          key={c}
          className="rounded-[7px] px-[9px] py-1 text-xs font-medium text-ink"
          style={{ background: (CATEGORY_META[c] ?? DEFAULT_CATEGORY_META).tint }}
        >
          {JOB_CATEGORY_LABELS[c]}
        </span>
      ))}
      {tags.map((tag) => (
        <span key={tag} className="rounded-[7px] border border-line bg-white/60 px-[9px] py-1 font-mono text-[11px] text-muted-foreground">
          {tag}
        </span>
      ))}
    </div>
  );
}
