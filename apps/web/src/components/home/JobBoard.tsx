'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { Job, JobStats, getJobs } from '@/lib/api';
import { EMPTY_QUERY, ListQuery, PAGE_SIZE, applyQueryPatch, mergeJobs, serializeListQuery } from '@/lib/listQuery';
import { formatTimeAgo } from '@/lib/time';
import { JobCard } from '@/components/JobCard';
import { FilterSidebar } from './FilterSidebar';
import { Hero } from './Hero';
import { LoadMore } from './LoadMore';

interface JobBoardProps {
  initialQuery: ListQuery;
  initialJobs: Job[];
  initialTotal: number;
  stats: JobStats;
}

// Keeps the address bar in step with the list without a server round trip;
// Next 14 picks up native history updates in useSearchParams.
function syncUrl(q: ListQuery) {
  const search = serializeListQuery(q);
  window.history.replaceState(window.history.state, '', search ? `?${search}` : window.location.pathname);
}

// Snapshot of the loaded list, taken when a card is opened. The router cache
// on Back only holds the first server render, so the list and scroll position
// are restored from here instead.
const SNAPSHOT_KEY = 'jobBoard:snapshot';

interface Snapshot {
  search: string;
  query: ListQuery;
  jobs: Job[];
  total: number;
  scrollY: number;
}

function takeSnapshot(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    sessionStorage.removeItem(SNAPSHOT_KEY);
    const snap: Snapshot | null = raw ? JSON.parse(raw) : null;
    return snap && snap.search === window.location.search ? snap : null;
  } catch {
    return null;
  }
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function JobBoard({ initialQuery, initialJobs, initialTotal, stats }: JobBoardProps) {
  const [query, setQueryState] = useState(initialQuery);
  const [jobs, setJobs] = useState(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState<false | 'replace' | 'append'>(false);
  const [error, setError] = useState<string | null>(null);
  // Only the latest request may write state; older responses are dropped
  const requestSeq = useRef(0);
  const pendingScroll = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const snap = takeSnapshot();
    if (!snap) return;
    pendingScroll.current = snap.scrollY;
    setQueryState(snap.query);
    setJobs(snap.jobs);
    setTotal(snap.total);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (pendingScroll.current === null) return;
    window.scrollTo(0, pendingScroll.current);
    pendingScroll.current = null;
  }, [jobs]);

  function saveSnapshot() {
    try {
      const snap: Snapshot = {
        search: window.location.search,
        query,
        jobs,
        total,
        scrollY: window.scrollY,
      };
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
    } catch {
      // Storage full or blocked: Back falls back to the server-rendered list
    }
  }

  async function load(q: ListQuery, append: boolean) {
    const seq = ++requestSeq.current;
    setLoading(append ? 'append' : 'replace');
    setError(null);
    try {
      const res = await getJobs({
        keyword: q.keyword || undefined,
        category: q.category || undefined,
        regionLimit: q.regionLimit || undefined,
        workType: q.workType || undefined,
        page: q.page,
        limit: PAGE_SIZE,
      });
      if (seq !== requestSeq.current) return;
      setJobs((prev) => (append ? mergeJobs(prev, res.data) : res.data));
      setTotal(res.pagination.total);
      if (append) {
        setQueryState(q);
        syncUrl(q);
      }
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error(err);
      setError('加载失败，请稍后重试');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  // Filter changes apply at once and reload page 1; Task 8's hero search calls this too
  function setQuery(patch: Partial<ListQuery>) {
    const next = applyQueryPatch(query, { ...patch, page: 1 });
    if (serializeListQuery(next) === serializeListQuery(query)) return;
    setQueryState(next);
    syncUrl(next);
    load(next, false);
  }

  function loadMore() {
    if (loading) return;
    load({ ...query, page: query.page + 1 }, true);
  }

  function clearFilters() {
    setQuery(EMPTY_QUERY);
  }

  // A chip in the hero wall filters the list and brings it into view
  function pickFromWall(patch: Partial<ListQuery>) {
    setQuery(patch);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <Hero query={query} stats={stats} total={total} onSearch={setQuery} onPick={pickFromWall} />
      <div
        ref={listRef}
        className="scroll-mt-16 mx-auto grid max-w-[1160px] gap-9 px-6 pb-20 pt-10 min-[860px]:grid-cols-[250px_1fr] [&>*]:min-w-0"
      >
        <FilterSidebar query={query} total={total} stats={stats} onChange={setQuery} onClear={clearFilters} />

        <section>
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              排序：<b className="font-medium text-ink">最新发布</b>
            </span>
            {stats.lastSyncedAt && <span suppressHydrationWarning>最近同步 {formatTimeAgo(stats.lastSyncedAt)}</span>}
          </div>

          {error ? (
            <div className="py-16 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : jobs.length === 0 && loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange" />
              <p className="text-sm text-muted-foreground">正在加载职位...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">暂无相关职位</p>
                <p className="mt-1 text-sm text-muted-foreground">请尝试调整筛选条件</p>
              </div>
            </div>
          ) : (
            <>
              <div
                onClickCapture={saveSnapshot}
                className={`grid grid-cols-[minmax(0,1fr)] gap-3.5 transition-opacity duration-200 ${loading === 'replace' ? 'opacity-50' : ''}`}
              >
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              <LoadMore loaded={jobs.length} total={total} loading={Boolean(loading)} onLoadMore={loadMore} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
