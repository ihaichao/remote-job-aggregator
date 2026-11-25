import Link from 'next/link';
import { NAV_LINKS } from '@/lib/site';
import { JOB_CATEGORY_LABELS } from '@/lib/constants';

export function SiteFooter() {
  const links = [...NAV_LINKS.slice(1), { href: '/contact', label: '联系我们' }, { href: '/privacy', label: '隐私政策' }];
  return <footer className="mt-10 border-t border-line bg-cream">
    <div className="mx-auto grid max-w-[1160px] gap-5 px-6 py-8 text-sm sm:grid-cols-3">
      <span className="font-medium">© 2025–2026 RemoteCN</span>
      <nav aria-label="网站导航"><h2 className="mb-2 font-bold">网站导航</h2><div className="flex flex-wrap gap-x-4 gap-y-2">{links.map(l =>
        <Link key={l.href} href={l.href}>{l.label}</Link>)}</div></nav>
      <nav aria-label="热门方向"><h2 className="mb-2 font-bold">热门方向</h2><div className="flex flex-wrap gap-x-4 gap-y-2">
        {['ai','backend','frontend','fullstack','devops','blockchain'].map(c => <Link key={c} href={`/category/${c}`}>{JOB_CATEGORY_LABELS[c]}</Link>)}</div></nav>
    </div></footer>;
}
