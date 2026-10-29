import Script from 'next/script';

// Rendered only on pages with real content (home list, job detail), so auto
// ads never land on 404s, empty lists or the thin legal pages
export function AdSense() {
  return (
    <Script
      id="adsense"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1549018081644908"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      async
    />
  );
}
