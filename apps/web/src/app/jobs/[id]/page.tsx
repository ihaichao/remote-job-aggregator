import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Badge } from '@/components/ui/badge'
import { JobDescription } from '@/components/JobDescription'
import { getServerJob, hasSubstantiveDescription } from '@/lib/api'
import { CATEGORY_LABELS, SOURCE_LABELS, WORK_TYPE_LABELS, getRegionLabel } from '@/lib/constants'
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

  const description = markdownToPlainText(job.description || job.title).slice(0, 150)
  return {
    title: job.title,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    // Keep thin or expired listings out of search results
    robots: job.isActive && hasSubstantiveDescription(job) ? undefined : { index: false, follow: true },
  }
}

export default async function JobPage({ params }: JobPageProps) {
  const job = await loadJob(params.id)
  if (!job) notFound()

  const categories = job.category.filter((c) => c !== 'other')
  const postedAt = new Date(job.datePosted || job.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const source = SOURCE_LABELS[job.sourceSite] || job.sourceSite
  const showDescription = hasSubstantiveDescription(job)

  const facts = [
    { label: '工作类型', value: WORK_TYPE_LABELS[job.workType] || job.workType },
    { label: '地区要求', value: getRegionLabel(job.regionLimit) },
    { label: '发布时间', value: postedAt },
    { label: '来源', value: source },
    ...(job.company ? [{ label: '公司', value: job.company }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          返回职位列表
        </Link>

        <article className="bg-card border border-border rounded-[18px] p-6 md:p-8">
          {!job.isActive && (
            <p className="mb-4 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
              该职位可能已经招满或下线，仅供参考。
            </p>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-ink leading-snug">{job.title}</h1>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
            <Clock className="h-3.5 w-3.5" />
            <span>{postedAt} 发布于 {source}</span>
          </div>

          {(categories.length > 0 || job.tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {categories.map((cat) => (
                <Badge key={cat} variant="category" className="text-xs px-2 py-0.5">
                  {CATEGORY_LABELS[cat] || cat}
                </Badge>
              ))}
              {job.tags.slice(0, 8).map((tag, index) => (
                <Badge key={index} variant="tag" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="mt-1 text-sm text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">职位描述</h2>
            {showDescription ? (
              <JobDescription markdown={job.description!} />
            ) : (
              <p className="text-sm text-muted-foreground">
                该职位的详细要求请查看原始招聘页面。
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href={job.applyUrl || job.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary shrink-0 whitespace-nowrap px-5 py-2.5"
            >
              查看原帖并申请
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="text-xs text-muted-foreground">
              信息整理自 {source}，请以原帖为准。投递前请核实公司信息，警惕任何要求预先付费的招聘。
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
