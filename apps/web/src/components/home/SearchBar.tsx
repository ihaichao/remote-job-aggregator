'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Clock, Globe, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOB_CATEGORY_LABELS, REGION_OPTIONS, WORK_TYPE_OPTIONS } from '@/lib/constants';
import { ListQuery } from '@/lib/listQuery';

type Fields = Pick<ListQuery, 'keyword' | 'category' | 'regionLimit' | 'workType'>;

interface SearchBarProps {
  query: ListQuery;
  onSearch: (patch: Partial<ListQuery>) => void;
}

// Radix Select reserves '' for "no value", so "不限" travels as this sentinel
const ANY = '__any__';

const KEYWORD_DEBOUNCE_MS = 500;

const CATEGORY_OPTIONS = [
  { value: '', label: '全部方向' },
  ...Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const SEGMENT = 'flex min-w-0 items-center gap-3 border-line px-4 py-2 max-[859px]:border-b min-[860px]:border-r last:border-0 min-[860px]:px-[18px] min-[860px]:py-2.5';

function SegmentSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  icon: typeof Search;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className={SEGMENT}>
      <Icon className="h-5 w-5 flex-none text-ink" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold leading-4 text-ink">{label}</div>
        <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? '' : v)} open={open} onOpenChange={onOpenChange}>
          <SelectTrigger
            aria-label={label}
            className={`mt-0.5 h-5 border-0 p-0 text-sm leading-5 shadow-none focus:ring-0 ${value ? 'text-ink' : 'text-muted-foreground'}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-line">
            {options.map((o) => (
              <SelectItem key={o.value || ANY} value={o.value || ANY}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function SearchBar({ query, onSearch }: SearchBarProps) {
  const [draft, setDraft] = useState<Fields>(query);
  // Radix lets each select open on its own; only one dropdown should be open at a time
  const [openField, setOpenField] = useState<keyof Fields | null>(null);
  const dropdown = (field: keyof Fields) => ({
    open: openField === field,
    onOpenChange: (open: boolean) => setOpenField((current) => (open ? field : current === field ? null : current)),
  });

  // Filters picked elsewhere (sidebar, hero wall) show up here too
  useEffect(() => {
    setDraft({ keyword: query.keyword, category: query.category, regionLimit: query.regionLimit, workType: query.workType });
  }, [query.keyword, query.category, query.regionLimit, query.workType]);

  // Typing searches on its own once the user pauses; Enter skips the wait
  useEffect(() => {
    const keyword = draft.keyword.trim();
    if (keyword === query.keyword) return;
    const timer = setTimeout(() => onSearch({ keyword }), KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft.keyword, query.keyword]);

  const set = (patch: Partial<Fields>) => setDraft((d) => ({ ...d, ...patch }));
  // A dropdown choice applies at once, like the sidebar, along with any keyword already typed
  const apply = (patch: Partial<Fields>) => onSearch({ ...draft, ...patch, keyword: draft.keyword.trim() });

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch({ ...draft, keyword: draft.keyword.trim() });
      }}
      className="pointer-events-auto mx-auto mt-[26px] grid max-w-[900px] items-center rounded-[20px] border-2 border-ink bg-white text-left min-[860px]:grid-cols-[1.5fr_1fr_1fr_1fr] min-[860px]:rounded-[22px]"
    >
      <label className={SEGMENT}>
        <Search className="h-5 w-5 flex-none text-ink" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold leading-4 text-ink">关键词</div>
          <input
            type="search"
            value={draft.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
            placeholder="React、Go、AI Agent…"
            className="mt-0.5 block h-5 w-full bg-transparent text-sm leading-5 text-ink outline-none placeholder:text-muted-foreground"
          />
        </div>
      </label>
      <SegmentSelect icon={Briefcase} label="职位方向" value={draft.category} options={CATEGORY_OPTIONS} onChange={(category) => apply({ category })} {...dropdown('category')} />
      <SegmentSelect icon={Globe} label="地域" value={draft.regionLimit} options={REGION_OPTIONS} onChange={(regionLimit) => apply({ regionLimit })} {...dropdown('regionLimit')} />
      <SegmentSelect icon={Clock} label="工作性质" value={draft.workType} options={WORK_TYPE_OPTIONS} onChange={(workType) => apply({ workType })} {...dropdown('workType')} />
    </form>
  );
}
