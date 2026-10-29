import Link from 'next/link';
import { NAV_LINKS } from '@/lib/site';
import { Logo } from './Logo';

// Sticky top bar shared by every page
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/[0.08] bg-peach/85 backdrop-blur-md">
      <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="flex shrink-0 gap-[18px] md:gap-[26px] whitespace-nowrap text-sm text-ink">
          {NAV_LINKS.slice(0, 2).map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink/70 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
