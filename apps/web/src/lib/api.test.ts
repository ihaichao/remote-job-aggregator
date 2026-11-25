import { vi, it, expect, afterEach } from 'vitest';
import { getServerJobStats, EMPTY_STATS } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('returns EMPTY_STATS when the backend is down', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
  await expect(getServerJobStats()).resolves.toEqual(EMPTY_STATS);
});

it('returns EMPTY_STATS on non-2xx', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
  await expect(getServerJobStats()).resolves.toEqual(EMPTY_STATS);
});

it('requires complete curation for ad and index eligibility', async () => {
  const { hasCuratedAnalysis } = await import('./api');
  const analysis = { summary: '摘'.repeat(30), fitForChina: '评'.repeat(20), highlights: ['一','二'], techStack: [] };
  const check = (aiAnalysis: unknown) => hasCuratedAnalysis({ aiAnalysis } as import('./api').Job);
  expect(check(analysis)).toBe(true);
  for (const value of [null, {}, { ...analysis, summary: '短' }, { ...analysis, fitForChina: '短' },
    { ...analysis, highlights: ['一', ' '] }, { ...analysis, techStack: {} }]) expect(check(value)).toBe(false);
});
