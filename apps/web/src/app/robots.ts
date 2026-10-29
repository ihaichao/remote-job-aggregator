import { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /_next/ stays crawlable: Google needs the CSS and JS to render pages
        disallow: ['/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
