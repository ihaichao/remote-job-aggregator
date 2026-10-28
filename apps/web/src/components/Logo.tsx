import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'md' | 'sm';
}

// Lowercase wordmark with an orange "cn" sticker
export function Logo({ size = 'md' }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="remotecn 首页"
      className={cn(
        'group inline-flex items-center gap-1 font-bold tracking-[-0.04em] text-ink',
        size === 'md' ? 'text-2xl' : 'text-xl',
      )}
    >
      remote
      <span
        className={cn(
          'ml-[3px] -rotate-[4deg] rounded-lg border-2 border-ink bg-orange px-1.5 pb-px leading-tight shadow-[0_3px_0_#0a0a0a] transition-transform group-hover:rotate-[3deg]',
          size === 'md' ? 'text-xl' : 'text-base',
        )}
      >
        cn
      </span>
    </Link>
  );
}
