'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Briefcase, Loader2 } from 'lucide-react';
import { Job, JobStats, getJobStats, getJobs } from '@/lib/api';
import { EMPTY_QUERY, ListQuery, PAGE_SIZE, applyQueryPatch, mergeJobs, parseListQuery, serializeListQuery } from '@/lib/listQuery';
import { ssrGaps } from '@/lib/ssrGaps';
import { formatTimeAgo } from '@/lib/time';
import { JobCard } from '@/components/JobCard';
import { FilterSidebar } from './FilterSidebar';
import { Hero } from './Hero';
import { LoadMore } from './LoadMore';

interface JobBoardProps {
  initialQuery: ListQuery;
  initialJobs: Job[];
  initialTotal: number;
  initialStats: JobStats;
}

// Keeps the address bar in step with the list without a server round trip.
// A null state lets Next 14 sync its router (and useSearchParams) to the new URL.
function writeUrl(search: string) {
  window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
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

export function JobBoard({ initialQuery, initialJobs, initialTotal, initialStats }: JobBoardProps) {
  const [stats, setStats] = useState(initialStats);
  const [query, setQueryState] = useState(initialQuery);
  const [jobs, setJobs] = useState(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState<false | 'replace' | 'append'>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  // Only the latest request may write state; older responses are dropped
  const requestSeq = useRef(0);
  const pendingScroll = useRef<number | null>(null);
  const restoredJobs = useRef<Job[] | null>(null);
  // The query string this list last wrote; anything else in the URL came from a link
  const ownSearch = useRef(serializeListQuery(initialQuery));
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);
  const fromSnapshot = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const snap = takeSnapshot();
    if (!snap) return;
    fromSnapshot.current = true;
    pendingScroll.current = snap.scrollY;
    restoredJobs.current = snap.jobs;
    ownSearch.current = serializeListQuery(snap.query);
    setQueryState(snap.query);
    setJobs(snap.jobs);
    setTotal(snap.total);
  }, []);

  // Scroll once the restored list is on the page, not the server-rendered one
  useIsomorphicLayoutEffect(() => {
    if (pendingScroll.current === null || jobs !== restoredJobs.current) return;
    window.scrollTo(0, pendingScroll.current);
    pendingScroll.current = null;
    restoredJobs.current = null;
  }, [jobs]);

  // Whatever the server could not fetch, fetch again from the browser
  useEffect(() => {
    const gaps = ssrGaps(initialJobs.length, initialStats);
    if (gaps.jobs && !fromSnapshot.current) load(initialQuery, false);
    if (gaps.stats) getJobStats().then(setStats, console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A link to the list (logo, nav) changed the URL under a mounted board: follow it
  useEffect(() => {
    const parsed = parseListQuery(Object.fromEntries(searchParams.entries()));
    if (serializeListQuery(parsed) === ownSearch.current) return;
    const linked = { ...parsed, page: 1 };
    syncUrl(linked);
    setQueryState(linked);
    load(linked, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function syncUrl(q: ListQuery) {
    ownSearch.current = serializeListQuery(q);
    writeUrl(ownSearch.current);
  }

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
    setLoadMoreError(null);
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
      // A failed "load more" keeps the jobs already shown
      (append ? setLoadMoreError : setError)('加载失败，请稍后重试');
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
      <Hero query={query} stats={stats} onSearch={setQuery} onPick={pickFromWall} />
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
              <LoadMore loaded={jobs.length} total={total} loading={Boolean(loading)} error={loadMoreError} onLoadMore={loadMore} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
