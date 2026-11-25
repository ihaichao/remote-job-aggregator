import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialPage, GuideCards } from '@/components/EditorialPage';
import { JobCard } from '@/components/JobCard';
import { getServerJobs } from '@/lib/api';
import { categorySlugs, getCategory } from '@/lib/categories';
import { JOB_CATEGORY_LABELS } from '@/lib/constants';
import { guidesForCategories } from '@/lib/guides';

type Props = { params: { slug: string } };
function categoryInfo(slug: string) {
  if (!categorySlugs.includes(slug)) notFound();
  return { editorial: getCategory(slug), label: JOB_CATEGORY_LABELS[slug] };
}
export function generateMetadata({ params: { slug } }: Props) {
  const { editorial, label } = categoryInfo(slug);
  return { title: editorial?.headline || `${label}远程岗位`, description: editorial?.seoDescription, alternates: { canonical: `/category/${slug}` } };
}

export default async function Category({ params: { slug } }: Props) {
  const { editorial, label } = categoryInfo(slug);
  const { data } = await getServerJobs({ category: slug, limit: 12 });
  return <EditorialPage title={editorial?.headline || `${label}远程岗位`} intro={editorial?.intro} ads={!!editorial}>
    {editorial && <div className="grid gap-4 md:grid-cols-2">
      <section className="editorial-panel"><h2 className="section-title">市场概况</h2><p>{editorial.marketSnapshot}</p>
        <h3 className="my-3 font-bold">核心技能</h3><div className="flex flex-wrap gap-2">{editorial.coreSkills.map(s => <span className="chip" key={s}>{s}</span>)}</div></section>
      <section className="editorial-panel"><h2 className="section-title">中国开发者求职建议</h2>
        <ul className="list-disc space-y-2 pl-5">{editorial.remoteTips.map(t => <li key={t}>{t}</li>)}</ul><h3 className="my-3 font-bold">时区协作</h3>{editorial.timezoneNote}</section>
    </div>}
    <section><h2 className="section-title">{label}在招职位</h2><div className="grid gap-3">{data.map(job => <JobCard key={job.id} job={job} />)}</div>
      {!data.length && <p>暂无可展示的岗位。</p>}<Link className="text-link mt-4 inline-block" href={`/?category=${slug}`}>筛选更多{label}职位</Link></section>
    <GuideCards title="相关远程求职指南" guides={guidesForCategories([slug])} />
    <nav><h2 className="section-title">其他技术方向</h2><div className="flex flex-wrap gap-2">{categorySlugs.filter(s => s !== slug).map(s =>
      <Link className="chip hover:bg-peach" key={s} href={`/category/${s}`}>{JOB_CATEGORY_LABELS[s]}</Link>)}</div></nav>
  </EditorialPage>;
}
