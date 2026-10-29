'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LIST_SNAPSHOT_KEY, cameFromList } from '@/lib/backNavigation';

function hasListSnapshot(): boolean {
  try {
    return sessionStorage.getItem(LIST_SNAPSHOT_KEY) !== null;
  } catch {
    return false;
  }
}

export function BackToList() {
  const router = useRouter();
  return (
    <Link
      href="/"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || !cameFromList(hasListSnapshot(), window.history.length)) return;
        e.preventDefault();
        router.back();
      }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" />
      返回职位列表
    </Link>
  );
}
