import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '远程工作聚合平台 - 软件开发职位',
  description: '汇聚全网远程开发职位，支持按技术栈、地域、协作方式筛选',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
