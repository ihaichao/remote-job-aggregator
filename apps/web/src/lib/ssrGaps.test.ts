import { describe, expect, it } from 'vitest';
import { EMPTY_STATS } from './api';
import { ssrGaps } from './ssrGaps';

describe('ssrGaps', () => {
  const stats = { ...EMPTY_STATS, total: 232 };

  it('asks for nothing when the server rendered jobs and stats', () => {
    expect(ssrGaps(20, stats)).toEqual({ jobs: false, stats: false });
  });

  it('refetches jobs when the server rendered an empty list', () => {
    expect(ssrGaps(0, stats)).toEqual({ jobs: true, stats: false });
  });

  it('refetches stats when the server fell back to empty stats', () => {
    expect(ssrGaps(20, EMPTY_STATS)).toEqual({ jobs: false, stats: true });
  });
});
