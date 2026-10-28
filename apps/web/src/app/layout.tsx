import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { BASE_URL } from '@/lib/site'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

// CJK font is served as unicode-range slices, so only the glyphs a page uses get downloaded
const notoSansSC = Noto_Sans_SC({
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sc',
  display: 'swap',
  preload: false,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RemoteCN - 面向中国开发者的远程工作平台',
    template: '%s | RemoteCN',
  },
  description: '实时聚合全网高质量远程开发岗位，让你轻松找到理想的远程工作机会。汇集 V2EX、Remote.com 等优质远程职位。',
  keywords: ['远程工作', '远程开发', 'remote jobs', '中国开发者', '程序员', '软件工程师', 'remote developer'],
  authors: [{ name: 'RemoteCN' }],
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: BASE_URL,
    siteName: 'RemoteCN',
    title: 'RemoteCN - 面向中国开发者的远程工作平台',
    description: '实时聚合全网高质量远程开发岗位，让你轻松找到理想的远程工作机会。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemoteCN - 面向中国开发者的远程工作平台',
    description: '实时聚合全网高质量远程开发岗位',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${spaceGrotesk.variable} ${notoSansSC.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1549018081644908"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
