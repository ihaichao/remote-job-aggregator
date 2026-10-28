import { CATEGORY_META } from './categoryMeta';
import { JOB_CATEGORY_LABELS } from './constants';

export type HeroChip =
  | { kind: 'category'; key: string; label: string; emoji: string; count?: number }
  | { kind: 'keyword'; label: string };

// Interleave categories and keywords so neighbouring lanes never line up
export function buildHeroLanes(
  categoryCounts: Record<string, number>,
  keywords: string[],
  laneCount = 6,
  perLane = 12,
): HeroChip[][] {
  const categories = Object.keys(CATEGORY_META);
  return Array.from({ length: laneCount }, (_, lane) =>
    Array.from({ length: perLane }, (_, i): HeroChip => {
      if ((i + lane) % 2 === 0) {
        const key = categories[(i * 2 + lane * 3) % categories.length];
        return { kind: 'category', key, label: JOB_CATEGORY_LABELS[key], emoji: CATEGORY_META[key].emoji, count: categoryCounts[key] };
      }
      return { kind: 'keyword', label: keywords[(i * 3 + lane * 5) % keywords.length] };
    }),
  );
}
