import { it, expect } from 'vitest';
import { formatTimeAgo, isFresh } from './time';

const now = new Date('2026-10-28T12:00:00Z');

it('formats relative time', () => {
  expect(formatTimeAgo('2026-10-28T11:59:30Z', now)).toBe('刚刚');
  expect(formatTimeAgo('2026-10-28T11:48:00Z', now)).toBe('12 分钟前');
  expect(formatTimeAgo('2026-10-28T09:00:00Z', now)).toBe('3 小时前');
  expect(formatTimeAgo('2026-10-26T12:00:00Z', now)).toBe('2 天前');
});

it('isFresh is true within 24h only', () => {
  expect(isFresh('2026-10-27T12:00:01Z', now)).toBe(true);
  expect(isFresh('2026-10-27T11:59:59Z', now)).toBe(false);
});
