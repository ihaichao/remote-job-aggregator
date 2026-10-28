import { describe, expect, it } from 'vitest';
import { EMPTY_STATS } from './api';
import { statCount } from './statCount';

describe('statCount', () => {
  const stats = { ...EMPTY_STATS, total: 43, categories: { ai: 21 }, regions: { CN: 20 } };

  it('reads a count, treating a missing key as 0', () => {
    expect(statCount(stats, 'categories', 'ai')).toBe(21);
    expect(statCount(stats, 'categories', 'game')).toBe(0);
  });

  it('uses the total for the "all" option', () => {
    expect(statCount(stats, 'regions', '')).toBe(43);
  });

  it('shows no counts at all when stats are unavailable', () => {
    expect(statCount(EMPTY_STATS, 'categories', 'ai')).toBeUndefined();
    expect(statCount(EMPTY_STATS, 'regions', '')).toBeUndefined();
  });
});
