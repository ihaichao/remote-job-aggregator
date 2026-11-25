import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { AdSense } from '@/components/AdSense'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { GuideCards } from '@/components/EditorialPage'
import { JobCard } from '@/components/JobCard'
import { guidesForCategories } from '@/lib/guides'
import { JobTags } from '@/components/JobTags'
import { BackToList } from '@/components/job/BackToList'
import { getServerJob, getServerRelatedJobs, hasCuratedAnalysis, displayCompany } from '@/lib/api'
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/lib/categoryMeta'
import { JOB_CATEGORY_LABELS, SOURCE_LABELS, WORK_TYPE_LABELS, getRegionLabel } from '@/lib/constants'
import { formatTimeAgo } from '@/lib/time'
import { markdownToPlainText } from '@/lib/utils'

interface JobPageProps {
  params: { id: string }
}

async function loadJob(idParam: string) {
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) return null
  return getServerJob(id)
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const job = await loadJob(params.id)
  if (!job) return { title: '职位不存在' }

  const description = (hasCuratedAnalysis(job) ? job.aiAnalysis.summary : markdownToPlainText(job.description || job.title)).slice(0, 150)
  return {
    title: job.title,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    // Keep thin or expired listings out of search results
    robots: job.isActive && hasCuratedAnalysis(job) ? undefined : { index: false, follow: true },
  }
}

function ApplyButton({ href, className = '' }: { href: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`btn-primary whitespace-nowrap px-5 py-3 text-[15px] font-semibold ${className}`}>
      前往申请
      <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

export default async function JobPage({ params }: JobPageProps) {
  const job = await loadJob(params.id)
  if (!job) notFound()

  const posted = job.datePosted || job.createdAt
  const postedDate = new Date(posted).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const categories = job.category.filter((c) => JOB_CATEGORY_LABELS[c])
  const icon = CATEGORY_META[categories[0]] ?? DEFAULT_CATEGORY_META
  const region = getRegionLabel(job.regionLimit)
  const workType = WORK_TYPE_LABELS[job.workType] || job.workType
  const applyHref = job.applyUrl || job.originalUrl

  const analysis = hasCuratedAnalysis(job) ? job.aiAnalysis : null
  const company = displayCompany(job.company)
  const source = SOURCE_LABELS[job.sourceSite] || job.sourceSite
  const plain = markdownToPlainText(job.description || '')
  const limit = analysis ? 240 : 320
  const excerpt = plain.length > limit ? plain.slice(0, limit - 1) + '…' : plain
  const related = analysis ? await getServerRelatedJobs(job.id) : []
  const guides = analysis ? guidesForCategories(categories) : []
  const facts = [
    ...(company ? [{ label: '公司', value: company }] : []),
    { label: '地域', value: region },
    { label: '工作性质', value: workType },
    { label: '发布时间', value: postedDate },
  ]

  return (
    <div className="flex min-h-screen flex-col max-[859px]:pb-[76px]">
      {/* Same bar as indexing: no ads on closed or near-empty postings */}
      {job.isActive && analysis && <AdSense />}
      <SiteHeader />

      <header className="bg-[linear-gradient(180deg,#ffd9b8_0%,#ffe8d4_70%,#fffaf5_100%)]">
        <div className="mx-auto max-w-[1160px] px-6 pb-9 pt-6 min-[860px]:pb-12">
          <BackToList />

          <div className="mt-6 flex items-start gap-4 min-[860px]:gap-5">
            <div
              className="grid h-14 w-14 flex-none place-items-center rounded-[16px] border border-white/80 text-[28px] min-[860px]:h-[72px] min-[860px]:w-[72px] min-[860px]:text-[34px]"
              style={{ background: icon.tint }}
              aria-hidden
            >
              {icon.emoji}
            </div>
            <div className="min-w-0">
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-ink min-[860px]:text-[36px]">{job.title}</h1>
              <p className="mt-2.5 text-xs font-medium uppercase tracking-[0.02em] text-muted-foreground">
                {company && company + ' · '}{region} · {workType} · <span suppressHydrationWarning>{formatTimeAgo(posted)}</span> 发布
              </p>
            </div>
          </div>

          <JobTags categories={categories} tags={job.tags.slice(0, 8)} className="mt-5 min-[860px]:ml-[92px]" />

          {!job.isActive && (
            <p className="mt-5 inline-flex rounded-[10px] border border-[#f2c58f] bg-[#fff4e5] px-3.5 py-2 text-sm text-[#8a4b08] min-[860px]:ml-[92px]">
              该职位可能已经招满或下线，仅供参考。
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1160px] flex-1 items-start gap-6 px-6 pb-12 pt-2 min-[860px]:grid-cols-[minmax(0,1fr)_300px] min-[860px]:gap-9 min-[860px]:pb-20">
        <article className="min-w-0 rounded-[18px] border border-line bg-white p-6 min-[860px]:p-9">
          {analysis && <div className="space-y-7 leading-7">
            <section><h2 className="section-title">岗位核心解读</h2><p>{analysis.summary}</p></section>
            <section><h2 className="section-title">中国开发者适配度分析</h2><p>{analysis.fitForChina}</p>
              <div className="mt-3 flex flex-wrap gap-2">{[
                ['英语', analysis.englishLevel], ['时区', analysis.timezoneHint], ['薪资', analysis.salaryHint],
              ].map(([label,value]) => value && <span className="chip" key={label}>{label} · {value}</span>)}</div></section>
            <section><h2 className="section-title">关键职责与要求提炼</h2><ul className="list-disc space-y-2 pl-5">
              {analysis.highlights.map(item => <li key={item}>{item}</li>)}</ul></section>
            <section><h2 className="section-title">核心技术栈</h2><div className="flex flex-wrap gap-2">
              {analysis.techStack.map(item => <span className="chip" key={item}>{item}</span>)}
              {!analysis.techStack.length && '原帖未明确指定技术栈。'}</div></section>
          </div>}
          <section className={analysis ? 'mt-8 rounded-xl border border-line bg-cream p-4' : ''}>
            <h2 className="mb-2 text-lg font-bold">原帖预览</h2>
            {excerpt && <p className="mb-3 text-sm leading-6 text-muted-foreground">{excerpt}</p>}
            <a className={analysis ? 'text-link' : 'btn-primary'} href={job.originalUrl} target="_blank" rel="noopener noreferrer">
              前往 {source} 查看完整招聘说明</a>
          </section>
        </article>

        <aside className="rounded-[18px] border border-line bg-white p-6 min-[860px]:sticky min-[860px]:top-[88px]">
          <ApplyButton href={applyHref} className="w-full max-[859px]:hidden" />
          <dl className="space-y-3 text-sm min-[860px]:mt-6">
            {facts.map((fact) => (
              <div key={fact.label} className="flex justify-between gap-4">
                <dt className="flex-none text-muted-foreground">{fact.label}</dt>
                <dd className="min-w-0 truncate text-right font-medium text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted-foreground">
            {/* Himalayas API terms require crediting it on every job it supplies */}
            {job.sourceSite === 'himalayas' && (
              <>
                职位来源：
                <a href={job.originalUrl} target="_blank" rel="noopener" className="font-medium text-ink underline underline-offset-2">
                  Himalayas
                </a>
                。
              </>
            )}
            投递前请核实公司信息，警惕任何要求预先付费的招聘。
          </p>
        </aside>
      </main>

      {analysis && <div className="mx-auto w-full max-w-[1160px] space-y-8 px-6 pb-6">
        {related.length > 0 && <section><h2 className="section-title">同方向其他在招远程岗位</h2>
          <div className="grid gap-3 md:grid-cols-2">{related.map(item => <JobCard key={item.id} job={item} />)}</div></section>}
        <GuideCards title="相关远程求职指南" guides={guides} />
      </div>}
      {/* Phones: keep the apply button in reach while reading a long description */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-6 py-3 backdrop-blur min-[860px]:hidden">
        <ApplyButton href={applyHref} className="w-full" />
      </div>

      <SiteFooter />
    </div>
  )
}
