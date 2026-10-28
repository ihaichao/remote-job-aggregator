import { it, expect } from 'vitest';
import { buildHeroLanes } from './heroLanes';

it('builds 6 lanes of 12 alternating chips', () => {
  const lanes = buildHeroLanes({ ai: 64, backend: 96 }, ['React', 'Go']);
  expect(lanes).toHaveLength(6);
  lanes.forEach((lane) => expect(lane).toHaveLength(12));
  expect(lanes[0][0].kind).toBe('category');
  expect(lanes[0][1].kind).toBe('keyword');
  expect(lanes[1][0].kind).toBe('keyword');
});

it('uses all 13 categories even without counts, and omits count when missing', () => {
  const chips = buildHeroLanes({}, ['React']).flat().filter((c) => c.kind === 'category');
  expect(new Set(chips.map((c) => (c as any).key)).size).toBe(13);
  expect(chips.every((c) => (c as any).count === undefined)).toBe(true);
});
