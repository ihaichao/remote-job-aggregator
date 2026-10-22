import Link from 'next/link';
import { NAV_LINKS, SITE_NAME } from '@/lib/site';

// Compact top bar for inner pages (the home page has its own hero header)
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-serif text-xl text-foreground">
          {SITE_NAME}
        </Link>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          {NAV_LINKS.slice(0, 3).map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
