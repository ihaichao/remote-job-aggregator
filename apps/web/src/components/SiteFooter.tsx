import Link from 'next/link';
import { NAV_LINKS, SITE_NAME } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/80 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-4">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-background/70 hover:text-background transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-background/60 text-center">
          Copyright © 2025-2026 {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
