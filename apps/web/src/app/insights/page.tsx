import { EditorialPage } from '@/components/EditorialPage';
import {
  CategoryBarChart,
  DonutChart,
  SourceBreakdownChart,
  TagHeatCloud,
  WeeklyTrendChart,
} from '@/components/insights/InsightCharts';
import { getServerJobInsights } from '@/lib/api';
import { getInsightsEditorial } from '@/lib/insights';
import { JOB_CATEGORY_LABELS, SOURCE_LABELS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  const e = getInsightsEditorial();
  return { title: e?.title || '远程招聘数据洞察', description: e?.seoDescription, alternates: { canonical: '/insights' } };
}

export default async function Insights() {
  const e = getInsightsEditorial();
  const stats = await getServerJobInsights();
  const share = (n = 0) => (stats?.total ? `${((100 * n) / stats.total).toFixed(1)}%` : '—');
  const ranked = (counts: Record<string, number>) => Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const regionWorldwide = stats?.regions.worldwide ?? 0;
  const regionCN = stats?.regions.CN ?? 0;
  const regionOther = Math.max(0, (stats?.total ?? 0) - regionWorldwide - regionCN);

  const workFulltime = stats?.workTypes.fulltime ?? 0;
  const workParttime = stats?.workTypes.parttime ?? 0;
  const workOther = Math.max(0, (stats?.total ?? 0) - workFulltime - workParttime);

  return (
    <EditorialPage title={e?.title || '远程招聘数据洞察'} intro={e?.subtitle} ads={!!e || !!stats?.total}>
      {stats ? (
        <>
          <section aria-label="市场概览" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['当前在招总量', stats.total],
              ['全球 / 中国区占比', `${share(regionWorldwide)} / ${share(regionCN)}`],
              ['全职 / 兼职占比', `${share(workFulltime)} / ${share(workParttime)}`],
              ['覆盖数据源数', Object.keys(stats.sources).length],
            ].map(([label, value]) => (
              <div key={label} className="editorial-panel">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </section>

          <p className="text-sm text-muted-foreground">
            {e?.updatedLabel} {stats.lastSyncedAt?.slice(0, 10)} · 已解读 {stats.analyzedCount} 个岗位
          </p>

          <WeeklyTrendChart data={stats.recentTrend} />

          <div className="grid gap-5 md:grid-cols-2">
            <DonutChart
              title="地域分布"
              centerLabel="在招岗位"
              segments={[
                { label: '中国区', value: regionCN, color: '#ff5a1f' },
                { label: '全球不限', value: regionWorldwide, color: '#18181b' },
                { label: '其他时区/地区', value: regionOther, color: '#d6ccc2' },
              ]}
            />
            <DonutChart
              title="工作性质分布"
              centerLabel="在招岗位"
              segments={[
                { label: '全职远程', value: workFulltime, color: '#ff5a1f' },
                { label: '兼职 / 项目制', value: workParttime, color: '#f59e0b' },
                { label: '其他', value: workOther, color: '#d6ccc2' },
              ]}
            />
          </div>

          <SourceBreakdownChart
            rows={ranked(stats.sources).map(([s, count]) => ({
              label: SOURCE_LABELS[s] || s,
              count,
            }))}
          />

          <div className="grid items-start gap-5 md:grid-cols-2">
            <CategoryBarChart
              totalJobs={stats.total}
              rows={ranked(stats.categories)
                .filter(([c]) => JOB_CATEGORY_LABELS[c])
                .map(([c, count]) => ({
                  label: JOB_CATEGORY_LABELS[c],
                  count,
                  href: `/category/${c}`,
                }))}
            />
            <TagHeatCloud tags={stats.topTags} />
          </div>
        </>
      ) : (
        <p className="editorial-panel">职位库暂时无法连接，实时统计稍后更新。</p>
      )}

      {e && (
        <>
          <section className="editorial-panel space-y-3">
            <h2 className="section-title">市场概览</h2>
            {e.overviewParagraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
          <section>
            <h2 className="section-title">市场观察</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {e.observations.map((o) => (
                <article className="editorial-panel space-y-3" key={o.title}>
                  <h3 className="text-lg font-bold">{o.title}</h3>
                  <p>{o.summary}</p>
                  <p className="border-l-2 border-orange pl-3">{o.takeaway}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </EditorialPage>
  );
}
