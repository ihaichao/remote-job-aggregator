import Link from 'next/link';
import { EditorialPage, GuideCards } from '@/components/EditorialPage';
import { getGuides } from '@/lib/guides';

export const metadata = { title: '远程求职指南', alternates: { canonical: '/guides' } };

export default function Guides({ searchParams }: { searchParams: { cat?: string } }) {
  const guides = getGuides();
  const categories = Array.from(new Set(guides.map(g => g.category)));
  const selected = searchParams.cat || '';
  const visible = guides.filter(g => !selected || g.category === selected);
  return <EditorialPage title="远程求职指南" intro="从英文简历、全英文技术面试到跨时区协作与合同避坑，按求职阶段找到你需要的实操指南。" ads={visible.length > 0}>
    <nav aria-label="按主题筛选" className="flex flex-wrap gap-2">{['', ...categories].map(cat =>
      <Link key={cat} className={`chip px-4 py-2 ${cat === selected ? 'bg-ink text-white' : 'bg-white border border-line'}`}
        href={cat ? `/guides?cat=${encodeURIComponent(cat)}` : '/guides'}>{cat || '全部'}</Link>)}</nav>
    <GuideCards guides={visible} />
    {!visible.length && <p>当前暂无该主题的指南。</p>}
  </EditorialPage>;
}
