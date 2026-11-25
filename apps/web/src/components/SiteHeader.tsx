import Link from 'next/link';
import { NAV_LINKS } from '@/lib/site';
import { Logo } from './Logo';

// Sticky top bar shared by every page
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/[0.08] bg-peach/85 backdrop-blur-md">
      <div className="max-w-[1160px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:px-6 sm:min-h-16">
        <Logo />
        <nav className="flex flex-wrap gap-x-3 gap-y-1 md:gap-[26px] whitespace-nowrap text-sm text-ink">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink/70 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
