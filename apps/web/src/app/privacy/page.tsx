import type { Metadata } from 'next'
import { PageShell } from '@/components/PageShell'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: '隐私政策',
  description: 'RemoteCN 隐私政策：我们收集哪些信息、如何使用 Cookie，以及 Google 广告和统计服务的说明。',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <PageShell title="隐私政策">
      <p>最后更新：2026 年 10 月 22 日</p>
      <p>
        RemoteCN（remotecn.com，下称「本站」）重视你的隐私。本政策说明你访问本站时，哪些信息会被收集，以及这些信息如何被使用。
      </p>

      <h2>我们收集的信息</h2>
      <p>
        本站不需要注册，也不会要求你提供姓名、电话等个人信息。和大多数网站一样，服务器会自动记录一些访问日志，
        例如 IP 地址、浏览器类型、访问时间和访问的页面，这些日志仅用于排查故障和防止滥用。
      </p>

      <h2>Cookie 的使用</h2>
      <p>
        Cookie 是网站保存在你浏览器里的小文件。本站自身不使用 Cookie 记录你的身份，
        但下面提到的第三方服务（Google Analytics 和 Google AdSense）会使用 Cookie。
      </p>

      <h2>Google Analytics（访问统计）</h2>
      <p>
        我们使用 Google Analytics 了解网站的访问量和使用情况，例如哪些页面更受欢迎，以便改进网站。
        Google Analytics 会通过 Cookie 收集匿名的统计数据，不会让我们识别出具体的个人。
      </p>

      <h2>Google AdSense（广告）</h2>
      <p>本站使用 Google AdSense 展示广告，以支付网站运营成本。关于广告，你需要知道：</p>
      <ul>
        <li>Google 等第三方供应商会使用 Cookie，根据你之前访问本站或其他网站的记录来投放广告。</li>
        <li>Google 使用广告 Cookie，使其和合作伙伴能够根据你访问本站和/或互联网上其他网站的情况，向你展示广告。</li>
        <li>
          你可以访问 <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google 广告设置</a>{' '}
          关闭个性化广告；也可以访问{' '}
          <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>{' '}
          关闭第三方供应商的个性化广告 Cookie。
        </li>
        <li>
          更多信息请参阅 Google 的说明：
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google 如何使用来自合作伙伴网站的信息</a>。
        </li>
      </ul>

      <h2>外部链接</h2>
      <p>
        职位详情页会链接到原始招聘页面（如 V2EX、电鸭社区等）。这些网站有各自的隐私政策，本站无法控制，建议你在访问时自行查阅。
      </p>

      <h2>如何拒绝 Cookie</h2>
      <p>你可以在浏览器设置中禁用或删除 Cookie。禁用后本站的职位浏览功能仍然可以正常使用。</p>

      <h2>政策更新</h2>
      <p>我们可能会不定期更新本政策，更新后会修改本页顶部的日期。</p>

      <h2>联系我们</h2>
      <p>
        如果你对本政策有任何疑问，请发邮件到 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>。
      </p>
    </PageShell>
  )
}
