import type { MetadataRoute } from 'next';
import { getServerJobs, hasCuratedAnalysis } from '@/lib/api';
import { categorySlugs } from '@/lib/categories';
import { getGuides } from '@/lib/guides';
import { BASE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = ['', '/guides', '/insights', '/about', '/contact', '/privacy',
    ...categorySlugs.map(s => `/category/${s}`), ...getGuides().map(g => `/guides/${g.slug}`),
  ].map(path => ({ url: BASE_URL + path }));
  const seen = new Set<number>();
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const result = await getServerJobs({ page, limit: 100 });
    for (const job of result.data) {
      if (job.isActive && hasCuratedAnalysis(job) && !seen.has(job.id)) {
        entries.push({ url: `${BASE_URL}/jobs/${job.id}`, lastModified: new Date(job.updatedAt) });
        seen.add(job.id);
      }
    }
    totalPages = result.pagination.totalPages;
    page++;
  }
  return entries;
}
