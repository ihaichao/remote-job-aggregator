import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line">
      <div className="max-w-[1160px] mx-auto px-6 py-3.5 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">
        <span>© 2025–2026 remotecn</span>
        <span className="text-sep">·</span>
        <Link href="/privacy" className="hover:text-ink transition-colors">
          隐私政策
        </Link>
      </div>
    </footer>
  );
}
