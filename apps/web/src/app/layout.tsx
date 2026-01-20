import type { Metadata } from 'next'
import { Inter, Calistoga, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
  title: '远程工作聚合 - 专为中国开发者打造',
  description: '聚合 V2EX、RemoteOK 等平台的远程软件开发工作机会',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${calistoga.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
