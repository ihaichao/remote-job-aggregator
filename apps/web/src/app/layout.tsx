import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Remote Job Aggregator - Find Remote Software Jobs',
  description: 'Aggregating remote software development jobs from V2EX, RemoteOK, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
