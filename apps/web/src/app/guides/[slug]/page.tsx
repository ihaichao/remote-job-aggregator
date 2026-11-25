import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EditorialPage, GuideCards } from '@/components/EditorialPage';
import { JobCard } from '@/components/JobCard';
import { getServerJobs, type Job } from '@/lib/api';
import { getGuides, extractHeadings } from '@/lib/guides';
import { JOB_CATEGORY_LABELS } from '@/lib/constants';

type Props = { params: { slug: string } };
export const revalidate = 300;
export function generateStaticParams() { return getGuides().map(({ slug }) => ({ slug })); }

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuides().find(g => g.slug === params.slug);
  if (!guide) notFound();
  const url = `/guides/${guide.slug}`;
  return { title: guide.title, description: guide.summary, alternates: { canonical: url },
    openGraph: { type: 'article', url, title: guide.title, description: guide.summary,
      publishedTime: guide.publishedAt, modifiedTime: guide.updatedAt, tags: guide.tags } };
}

export default async function Article({ params }: Props) {
  const guides = getGuides();
  const guide = guides.find(g => g.slug === params.slug);
  if (!guide) notFound();
  const headings = extractHeadings(guide.markdown);
  const related = guides.filter(g => g.slug !== guide.slug).map(g => ({
    guide: g, score: Number(g.category === guide.category) + g.tags.filter(t => guide.tags.includes(t)).length,
  })).filter(g => g.score).sort((a,b) => b.score - a.score).slice(0,3).map(item => item.guide);
  let jobs: Job[] = [];
  let category = '';
  for (const cat of guide.relatedCategories.filter(c => JOB_CATEGORY_LABELS[c])) {
    const result = await getServerJobs({ category: cat, limit: 4 }, revalidate);
    if (result.data.length) { category = cat; jobs = result.data; break; }
  }
  return <EditorialPage ads title={guide.title} intro={guide.summary} beforeTitle={<nav className="text-sm">
    <Link href="/">首页</Link> / <Link href="/guides">远程指南</Link> / <Link href={`/guides?cat=${encodeURIComponent(guide.category)}`}>{guide.category}</Link></nav>}>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <article className="editorial-panel">
        <header className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-5 text-sm">
          {guide.readingMinutes} 分钟阅读 · {guide.updatedAt} 更新 {guide.tags.map(t => <span key={t} className="chip">{t}</span>)}
        </header>
        <div className="guide-body"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          h2: ({ node, children }) => <h2 id={headings.find(h => h.line === node?.position?.start.line)?.id}>{children}</h2>,
          table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
        }}>{guide.markdown}</ReactMarkdown></div>
      </article>
      {headings.length > 0 && <nav aria-label="文章目录" className="editorial-panel hidden max-h-[75vh] overflow-y-auto lg:sticky lg:top-20 lg:block">
        <h2 className="mb-3 font-bold">文章目录</h2>{headings.map(h => <a className="block py-1 text-sm hover:underline" key={h.id} href={`#${h.id}`}>{h.text}</a>)}</nav>}
    </div>
    <GuideCards title="相关指南" guides={related} />
    {jobs.length > 0 && <section><h2 className="section-title">相关在招岗位</h2><div className="grid gap-3">{jobs.map(job => <JobCard key={job.id} job={job} />)}</div>
      <Link className="text-link mt-4 inline-block" href={`/category/${category}`}>查看全部{JOB_CATEGORY_LABELS[category]}岗位</Link></section>}
  </EditorialPage>;
}
