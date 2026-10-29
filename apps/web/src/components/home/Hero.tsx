import { JobStats } from '@/lib/api';
import { ListQuery } from '@/lib/listQuery';
import { HeroWall } from './HeroWall';
import { SearchBar } from './SearchBar';

interface HeroProps {
  query: ListQuery;
  stats: JobStats;
  onSearch: (patch: Partial<ListQuery>) => void;
  // Wall chips; defaults to onSearch
  onPick?: (patch: Partial<ListQuery>) => void;
}

export function Hero({ query, stats, onSearch, onPick = onSearch }: HeroProps) {
  return (
    <section data-hero className="relative overflow-hidden bg-[linear-gradient(180deg,#ffd9b8_0%,#ffe8d4_70%,#fffaf5_100%)]">
      <HeroWall categoryCounts={stats.categories} onPick={onPick} />
      <div className="pointer-events-none relative z-[2] mx-auto max-w-[1160px] px-6 py-7 text-center min-[860px]:pb-10 min-[860px]:pt-11">
        <h1 className="pointer-events-auto mx-auto w-fit text-[clamp(30px,3.75vw,48px)] font-bold leading-none tracking-[-0.01em] text-ink">
          {/* Phrases are kept whole so narrow screens wrap between them */}
          <span className="inline-block">面向中国开发者的</span>
          <span className="inline-block">远程工作平台</span>
        </h1>
        <p className="pointer-events-auto mx-auto mt-3.5 w-fit max-w-[620px] text-base font-light leading-6 text-ink">
          <span className="inline-block">实时聚合全网高质量远程开发岗位，</span>
          <span className="inline-block">让你轻松找到理想的远程工作机会</span>
        </p>
        <SearchBar query={query} onSearch={onSearch} />
        <div className="pointer-events-auto mx-auto mt-[18px] flex w-fit flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-light text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/75 py-1.5 pl-2 pr-3 text-xs font-medium text-ink">
            <span className="h-2 w-2 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_#16a34a33]" />
            每小时更新
          </span>
          {stats.total > 0 && (
            <span>
              共 <b className="font-medium text-ink">{stats.total}</b> 个在招职位
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
