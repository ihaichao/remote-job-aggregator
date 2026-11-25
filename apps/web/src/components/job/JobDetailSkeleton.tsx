import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-line ${className}`} />;
}

// Covers the list while the server renders a job. Mirrors the layout of
// jobs/[id]/page.tsx so nothing jumps when the job arrives.
export function JobDetailSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-cream" role="status" aria-label="职位加载中">
      <SiteHeader />

      <header className="bg-[linear-gradient(180deg,#ffd9b8_0%,#ffe8d4_70%,#fffaf5_100%)]">
        <div className="mx-auto max-w-[1160px] animate-pulse px-6 pb-9 pt-6 min-[860px]:pb-12">
          <div className="h-5 w-28 rounded-md bg-white/70" />
          <div className="mt-6 flex items-start gap-4 min-[860px]:gap-5">
            <div className="h-14 w-14 flex-none rounded-[16px] bg-white/70 min-[860px]:h-[72px] min-[860px]:w-[72px]" />
            <div className="min-w-0 flex-1">
              <div className="h-8 w-4/5 max-w-[560px] rounded-md bg-white/70 min-[860px]:h-10" />
              <div className="mt-3 h-4 w-48 rounded-md bg-white/70" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1160px] flex-1 items-start gap-6 px-6 pb-12 pt-2 min-[860px]:grid-cols-[minmax(0,1fr)_300px] min-[860px]:gap-9 min-[860px]:pb-20">
        <article className="min-w-0 rounded-[18px] border border-line bg-white p-6 min-[860px]:p-9">
          <h2 className="mb-4 text-xl font-bold text-ink">职位描述</h2>
          <div className="animate-pulse space-y-3">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-11/12" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-3/4" />
            <Bar className="h-4 w-5/6" />
            <Bar className="h-4 w-2/3" />
          </div>
        </article>

        <aside className="animate-pulse space-y-3 rounded-[18px] border border-line bg-white p-6 max-[859px]:hidden min-[860px]:sticky min-[860px]:top-[88px]">
          <Bar className="h-11 w-full" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-full" />
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}
