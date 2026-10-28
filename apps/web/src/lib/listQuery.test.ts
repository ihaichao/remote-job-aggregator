import { describe, it, expect } from 'vitest';
import { parseListQuery, serializeListQuery, mergeJobs, applyQueryPatch, EMPTY_QUERY } from './listQuery';

describe('parseListQuery', () => {
  it('reads valid params', () => {
    expect(parseListQuery({ keyword: ' Go ', category: 'ai', regionLimit: 'CN', workType: 'parttime', page: '3' }))
      .toEqual({ keyword: 'Go', category: 'ai', regionLimit: 'CN', workType: 'parttime', page: 3 });
  });
  it('falls back on invalid values and clamps page to 1..10', () => {
    expect(parseListQuery({ category: 'xyz', regionLimit: 'US', workType: 'contract', page: 'abc' })).toEqual(EMPTY_QUERY);
    expect(parseListQuery({ page: '0' }).page).toBe(1);
    expect(parseListQuery({ page: '9999' }).page).toBe(10);
  });
  it('takes the first value of repeated params', () => {
    expect(parseListQuery({ category: ['backend', 'ai'] }).category).toBe('backend');
  });
});

describe('serializeListQuery', () => {
  it('omits defaults', () => {
    expect(serializeListQuery(EMPTY_QUERY)).toBe('');
    expect(serializeListQuery({ ...EMPTY_QUERY, category: 'ai', page: 3 })).toBe('category=ai&page=3');
  });
  it('round-trips', () => {
    const q = { keyword: 'AI Agent', category: 'ai', regionLimit: 'worldwide', workType: 'fulltime', page: 2 };
    expect(parseListQuery(Object.fromEntries(new URLSearchParams(serializeListQuery(q))))).toEqual(q);
  });
});

describe('mergeJobs', () => {
  it('appends without duplicates', () => {
    expect(mergeJobs([{ id: 1 }, { id: 2 }], [{ id: 2 }, { id: 3 }]).map((j) => j.id)).toEqual([1, 2, 3]);
  });
});

describe('applyQueryPatch', () => {
  const base = { ...EMPTY_QUERY, category: 'ai', page: 3 };

  it('resets to page 1 when a filter changes', () => {
    expect(applyQueryPatch(base, { category: 'backend' })).toEqual({ ...base, category: 'backend', page: 1 });
  });

  it('keeps the page when only the page changes', () => {
    expect(applyQueryPatch(base, { page: 4 })).toEqual({ ...base, page: 4 });
  });

  it('keeps the page when a filter is set to its current value', () => {
    expect(applyQueryPatch(base, { category: 'ai' })).toEqual(base);
  });
});
