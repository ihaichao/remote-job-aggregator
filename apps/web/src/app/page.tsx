import { AdSense } from '@/components/AdSense';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { JobBoard } from '@/components/home/JobBoard';
import { getServerJobStats, getServerJobs } from '@/lib/api';
import { PAGE_SIZE, mergeJobs, parseListQuery, serializeListQuery } from '@/lib/listQuery';

interface HomeProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function Home({ searchParams }: HomeProps) {
  const q = parseListQuery(searchParams);
  const filters = {
    keyword: q.keyword || undefined,
    category: q.category || undefined,
    regionLimit: q.regionLimit || undefined,
    workType: q.workType || undefined,
  };

  // Render every page the URL asks for, so coming back from a detail page restores the list
  const [stats, ...pages] = await Promise.all([
    getServerJobStats(),
    ...Array.from({ length: q.page }, (_, i) => getServerJobs({ ...filters, page: i + 1, limit: PAGE_SIZE })),
  ]);
  const jobs = pages.reduce((acc, res) => mergeJobs(acc, res.data), [] as (typeof pages)[number]['data']);
  const total = pages[0]?.pagination.total ?? 0;

  return (
    <main className="min-h-screen">
      {jobs.length > 0 && <AdSense />}
      <SiteHeader />
      <JobBoard key={serializeListQuery(q)} initialQuery={q} initialJobs={jobs} initialTotal={total} initialStats={stats} />
      <SiteFooter />
    </main>
  );
}
