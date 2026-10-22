import { MetadataRoute } from 'next'
import { getServerJobs, hasSubstantiveDescription } from '@/lib/api'
import { BASE_URL } from '@/lib/site'

// Job list changes throughout the day; build the sitemap per request
export const dynamic = 'force-dynamic'

const SITEMAP_JOB_PAGES = 5 // 5 pages x 100 = the 500 most recent jobs

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const responses = await Promise.all(
    Array.from({ length: SITEMAP_JOB_PAGES }, (_, i) => getServerJobs({ page: i + 1, limit: 100 })),
  )

  const jobPages: MetadataRoute.Sitemap = responses
    .flatMap((res) => res.data)
    .filter(hasSubstantiveDescription)
    .map((job) => ({
      url: `${BASE_URL}/jobs/${job.id}`,
      lastModified: new Date(job.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  return [...staticPages, ...jobPages]
}
