import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { CATEGORY_LABELS } from '@/lib/constants'

export const metadata: Metadata = {
  title: '关于我们',
  description: 'RemoteCN 是一个面向中国开发者的远程工作聚合平台，介绍我们的职位来源、分类方式和更新频率。',
  alternates: { canonical: '/about' },
}

const categoryNames = Object.entries(CATEGORY_LABELS)
  .filter(([key]) => key !== 'other')
  .map(([, label]) => label)
  .join('、')

export default function AboutPage() {
  return (
    <PageShell title="关于 RemoteCN">
      <p>
        RemoteCN 是一个专门为中国开发者整理远程工作机会的网站。远程职位散落在很多社区和招聘平台上，
        挨个去翻既费时间又容易漏掉。我们把这些信息集中到一个地方，按技术方向分好类，让你几分钟就能看完当天的新机会。
      </p>

      <h2>职位从哪里来</h2>
      <p>我们定期从以下公开渠道收集远程开发相关的招聘信息：</p>
      <ul>
        <li><strong>V2EX</strong>：国内开发者社区的「酷工作」等招聘节点，以国内公司和团队为主。</li>
        <li><strong>电鸭社区（Eleduck）</strong>：国内知名的远程工作社区，有大量全职和兼职远程岗位。</li>
        <li><strong>Real Work From Anywhere</strong>：面向全球招聘、不限地区的远程职位。</li>
        <li><strong>Remote.com</strong>：海外公司发布的远程工程师岗位。</li>
      </ul>
      <p>每条职位都会注明来源，并附上原帖链接。申请时请以原帖信息为准。</p>

      <h2>我们做了哪些整理</h2>
      <ul>
        <li><strong>去重</strong>：同一个职位在多个地方发布时，只保留一条。</li>
        <li><strong>分类</strong>：按技术方向分为 {categoryNames} 等类别，一个职位最多可以属于 3 个类别。</li>
        <li><strong>标注工作类型和地区要求</strong>：区分全职、兼职，以及是否限制所在地区或时区。</li>
        <li><strong>过滤</strong>：尽量剔除需要坐班的岗位和与开发无关的信息。</li>
        <li><strong>每天更新</strong>：每天自动抓取两次，新职位通常当天就会出现在列表里。</li>
      </ul>

      <h2>使用建议</h2>
      <p>
        投递前请仔细阅读原帖，确认公司信息、薪资和合同方式。远程招聘中偶尔会有不实信息，
        遇到要求预先付费、索要证件照片等情况请提高警惕。如果发现可疑职位，欢迎<Link href="/contact">告诉我们</Link>，我们会尽快核实并下架。
      </p>

      <h2>免费使用</h2>
      <p>
        RemoteCN 对求职者完全免费，不需要注册。网站通过展示广告来支付服务器等运营成本，
        具体可以查看我们的<Link href="/privacy">隐私政策</Link>。
      </p>
    </PageShell>
  )
}
