import { JobStats } from '@/lib/api';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/lib/categoryMeta';
import { JOB_CATEGORY_LABELS, REGION_OPTIONS, WORK_TYPE_OPTIONS } from '@/lib/constants';
import { ListQuery } from '@/lib/listQuery';

interface FilterSidebarProps {
  query: ListQuery;
  total: number;
  stats: JobStats;
  onChange: (patch: Partial<ListQuery>) => void;
  onClear: () => void;
}

interface Option {
  value: string;
  label: string;
  count?: number;
}

function OptionButton({ option, selected, onSelect }: { option: Option; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-none items-center justify-between gap-3 rounded-[9px] px-2.5 py-[7px] text-left text-sm transition-colors max-[859px]:border max-[859px]:border-line max-[859px]:bg-white min-[860px]:-mx-2.5 min-[860px]:w-[calc(100%+20px)] ${
        selected
          ? 'bg-white font-medium text-ink shadow-[inset_0_0_0_1.5px_#0a0a0a]'
          : 'font-normal text-muted-foreground hover:bg-[#f6eee6]'
      }`}
    >
      <span className="whitespace-nowrap">{option.label}</span>
      {option.count !== undefined && <span className="font-mono text-[11px] text-sep">{option.count}</span>}
    </button>
  );
}

function Group({ title, children, desktopOnly }: { title: string; children: React.ReactNode; desktopOnly?: boolean }) {
  return (
    <div className={`mt-[26px] ${desktopOnly ? 'max-[859px]:hidden' : 'max-[859px]:mt-4'}`}>
      <h4 className="mb-2.5 text-base font-semibold leading-6 text-ink max-[859px]:hidden">{title}</h4>
      {children}
    </div>
  );
}

export function FilterSidebar({ query, total, stats, onChange, onClear }: FilterSidebarProps) {
  const categories: Option[] = [
    { value: '', label: '全部', count: stats.total || undefined },
    ...Object.keys(JOB_CATEGORY_LABELS)
      .sort((a, b) => (stats.categories[b] ?? 0) - (stats.categories[a] ?? 0))
      .map((key) => ({
        value: key,
        label: `${(CATEGORY_META[key] ?? DEFAULT_CATEGORY_META).emoji} ${JOB_CATEGORY_LABELS[key]}`,
        count: stats.categories[key] ?? 0,
      })),
  ];
  const regions = REGION_OPTIONS.map((o) => ({ ...o, count: o.value ? stats.regions[o.value] ?? 0 : stats.total || undefined }));
  const workTypes = WORK_TYPE_OPTIONS.map((o) => ({ ...o, count: o.value ? stats.workTypes[o.value] ?? 0 : stats.total || undefined }));

  return (
    <aside className="min-w-0 self-start min-[860px]:sticky min-[860px]:top-[88px]">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          <b className="font-semibold text-ink">{total}</b> 个职位
        </span>
        <button type="button" onClick={onClear} className="rounded-lg bg-[#f3ebe3] px-2.5 py-[5px] text-sm font-medium text-muted-foreground hover:text-ink">
          ✕ 清除筛选
        </button>
      </div>

      <Group title="职位方向">
        <div className="max-[859px]:-mx-6 max-[859px]:flex max-[859px]:gap-2 max-[859px]:overflow-x-auto max-[859px]:px-6 max-[859px]:pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((o) => (
            <OptionButton key={o.value || 'all'} option={o} selected={query.category === o.value} onSelect={() => onChange({ category: o.value })} />
          ))}
        </div>
      </Group>

      <Group title="地域" desktopOnly>
        {regions.map((o) => (
          <OptionButton key={o.value || 'all'} option={o} selected={query.regionLimit === o.value} onSelect={() => onChange({ regionLimit: o.value })} />
        ))}
      </Group>

      <Group title="工作性质" desktopOnly>
        {workTypes.map((o) => (
          <OptionButton key={o.value || 'all'} option={o} selected={query.workType === o.value} onSelect={() => onChange({ workType: o.value })} />
        ))}
      </Group>
    </aside>
  );
}
