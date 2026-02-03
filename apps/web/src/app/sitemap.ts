import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://remotecn.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    // Add more pages as the site grows
    // {
    //   url: `${BASE_URL}/jobs`,
    //   lastModified: new Date(),
    //   changeFrequency: 'hourly',
    //   priority: 0.9,
    // },
  ]
}
