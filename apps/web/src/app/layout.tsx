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

export const metadata: Metadata = {
  title: '面向中国开发者的远程工作平台',
  description: '实时聚合全网高质量远程开发岗位，让你轻松找到理想的远程工作机会',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
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
