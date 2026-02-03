import type { Metadata } from 'next'
import { Source_Sans_3, Calistoga, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sc',
  display: 'swap',
})

const calistoga = Calistoga({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-calistoga',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://remotecn.com'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RemoteCN - 远程工作平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemoteCN - 面向中国开发者的远程工作平台',
    description: '实时聚合全网高质量远程开发岗位',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
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
    <html lang="zh-CN" className={`${sourceSans.variable} ${notoSansSC.variable} ${calistoga.variable} ${jetbrainsMono.variable}`}>
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
