import { JobStats } from '@/lib/api';
import { ListQuery } from '@/lib/listQuery';
import { HeroWall } from './HeroWall';
import { SearchBar } from './SearchBar';

interface HeroProps {
  query: ListQuery;
  stats: JobStats;
  total: number;
  onSearch: (patch: Partial<ListQuery>) => void;
  // Wall chips; defaults to onSearch
  onPick?: (patch: Partial<ListQuery>) => void;
}

export function Hero({ query, stats, total, onSearch, onPick = onSearch }: HeroProps) {
  return (
    <section data-hero className="relative overflow-hidden bg-[linear-gradient(180deg,#ffd9b8_0%,#ffe8d4_70%,#fffaf5_100%)]">
      <HeroWall categoryCounts={stats.categories} onPick={onPick} />
      <div className="pointer-events-none relative z-[2] mx-auto max-w-[1160px] px-6 py-7 text-center min-[860px]:pb-10 min-[860px]:pt-11">
        <h1 className="text-[clamp(30px,3.75vw,48px)] font-bold leading-none tracking-[-0.01em] text-ink">为中国开发者找远程工作</h1>
        <p className="mx-auto mt-3.5 max-w-[620px] text-base font-light leading-6 text-ink">
          聚合全网远程开发岗位，AI 自动分类。前端、后端、AI、Web3，一处搜完。
        </p>
        <SearchBar query={query} onSearch={onSearch} />
        <div className="mt-[18px] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-light text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/75 py-1.5 pl-2 pr-3 text-xs font-medium text-ink">
            <span className="h-2 w-2 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_#16a34a33]" />
            每小时更新
          </span>
          <span>
            共 <b className="font-medium text-ink">{stats.total || total}</b> 个在招职位
          </span>
        </div>
      </div>
    </section>
  );
}
