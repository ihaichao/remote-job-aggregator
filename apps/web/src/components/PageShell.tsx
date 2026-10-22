import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

// Layout for text pages such as About and Privacy
export function PageShell({ title, children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl text-foreground mb-8">{title}</h1>
        <div className="space-y-6 text-foreground/90 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-accent [&_a]:underline">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
