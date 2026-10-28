import { vi, it, expect, afterEach } from 'vitest';
import { getServerJobStats, EMPTY_STATS } from './api';

afterEach(() => vi.unstubAllGlobals());

it('returns EMPTY_STATS when the backend is down', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
  await expect(getServerJobStats()).resolves.toEqual(EMPTY_STATS);
});

it('returns EMPTY_STATS on non-2xx', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
  await expect(getServerJobStats()).resolves.toEqual(EMPTY_STATS);
});
