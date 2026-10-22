import type { Metadata } from 'next'
import { PageShell } from '@/components/PageShell'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: '联系我们',
  description: '联系 RemoteCN：职位纠错、下架申请、合作与建议。',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <PageShell title="联系我们">
      <p>
        有任何问题或建议，欢迎发邮件到{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>，我们一般会在 3 个工作日内回复。
      </p>

      <h2>常见的联系原因</h2>
      <ul>
        <li><strong>职位信息有误或已失效</strong>：请附上职位页面链接，我们会更新或下架。</li>
        <li><strong>举报可疑职位</strong>：如果某个职位要求预先付费、索要敏感个人信息，请告诉我们。</li>
        <li><strong>招聘方申请下架</strong>：如果你是职位发布者，不希望职位出现在本站，我们会在核实后删除。</li>
        <li><strong>推荐新的职位来源</strong>：知道其他优质的远程招聘渠道？欢迎推荐。</li>
        <li><strong>合作与功能建议</strong>：任何让网站更好用的想法都可以发给我们。</li>
      </ul>
    </PageShell>
  )
}
