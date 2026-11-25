import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Guide } from '@/lib/guides';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { AdSense } from './AdSense';

export function EditorialPage({ title, intro, beforeTitle, children, ads }: {
  title: string; intro?: string; beforeTitle?: ReactNode; children: ReactNode; ads?: boolean;
}) {
  return <div className="min-h-screen text-ink">
    <SiteHeader />
    {ads && <AdSense />}
    <header className="bg-gradient-to-b from-peach to-cream">
      <div className="mx-auto max-w-[1160px] space-y-4 px-5 py-10 sm:py-14">
        {beforeTitle}
        <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="max-w-3xl whitespace-pre-line leading-7 text-ink/75">{intro}</p>}
      </div>
    </header>
    <main className="mx-auto max-w-[1160px] space-y-8 px-5 pb-12">{children}</main>
    <SiteFooter />
  </div>;
}

export function GuideCards({ guides, title }: { guides: Guide[]; title?: string }) {
  if (!guides.length) return null;
  return <section>{title && <h2 className="section-title">{title}</h2>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{guides.map(guide =>
      <Link className="editorial-panel space-y-3 transition hover:border-orange" key={guide.slug} href={`/guides/${guide.slug}`}>
        <span className="chip bg-peach-2">{guide.category}</span>
        <h3 className="text-xl font-bold">{guide.title}</h3><p className="text-sm leading-6">{guide.summary}</p>
        <div className="flex flex-wrap gap-1">{guide.tags.map(tag => <span key={tag} className="chip">{tag}</span>)}</div>
        <p className="text-xs text-muted-foreground">{guide.readingMinutes} 分钟阅读 · {guide.updatedAt} 更新</p>
      </Link>)}</div>
  </section>;
}
