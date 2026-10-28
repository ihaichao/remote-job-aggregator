import { ImageResponse } from 'next/og';

export const alt = 'remotecn - 为中国开发者找远程工作';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Latin-only text so the default font renders it; the Chinese title lives in alt and page metadata
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #ffd9b8 0%, #ffe8d4 60%, #fffaf5 100%)',
          color: '#0a0a0a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 120, fontWeight: 700, letterSpacing: '-0.04em' }}>
          remote
          <div
            style={{
              display: 'flex',
              marginLeft: 14,
              padding: '0 22px 6px',
              fontSize: 100,
              background: '#ff8a1f',
              border: '6px solid #0a0a0a',
              borderRadius: 28,
              boxShadow: '0 10px 0 #0a0a0a',
              transform: 'rotate(-4deg)',
            }}
          >
            cn
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, color: '#6b7080' }}>Remote jobs for Chinese developers</div>
      </div>
    ),
    size,
  );
}
