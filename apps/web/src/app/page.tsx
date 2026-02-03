import { JobList } from '@/components/JobList';
import { getServerJobs } from '@/lib/api';

export default async function Home() {
  // Fetch initial jobs on server for SSR (SEO-friendly)
  const initialData = await getServerJobs({ page: 1, limit: 10 });
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-secondary/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20">
          {/* Section Label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
              Remote Jobs for Chinese Developers
            </span>
          </div>
          
          {/* Headline */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
            面向<span className="gradient-text">中国开发者</span>的
            <span className="gradient-text">远程工作</span>
            平台
          </h1>
          
          {/* Subtitle */}
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            实时聚合全网高质量远程开发岗位，让你轻松找到理想的远程工作机会
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <JobList 
          initialJobs={initialData.data} 
          initialPagination={initialData.pagination}
        />
      </div>

      {/* Footer */}
      <footer className="bg-foreground text-background/80 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-sm text-background/60 text-center">
            Copyright © 2025-2026 RemoteCN. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

