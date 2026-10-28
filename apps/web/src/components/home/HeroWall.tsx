import { HERO_KEYWORDS } from '@/lib/constants';
import { HeroChip, buildHeroLanes } from '@/lib/heroLanes';
import { ListQuery } from '@/lib/listQuery';

interface HeroWallProps {
  categoryCounts: Record<string, number>;
  onPick: (patch: Partial<ListQuery>) => void;
}

const CHIP_BASE =
  'inline-flex flex-none items-center gap-2 whitespace-nowrap border border-white/80 px-4 text-[#9c8572] transition-all duration-200 hover:-translate-y-0.5 hover:-rotate-1 hover:bg-white hover:text-ink hover:shadow-[0_8px_20px_-8px_rgba(120,60,10,0.35)]';

function Chip({ chip, onPick }: { chip: HeroChip; onPick: HeroWallProps['onPick'] }) {
  const common = { type: 'button' as const, tabIndex: -1 };
  if (chip.kind === 'category') {
    return (
      <button {...common} onClick={() => onPick({ category: chip.key })} className={`${CHIP_BASE} h-11 rounded-[13px] bg-white/55 text-[17px] font-bold tracking-[-0.01em]`}>
        <span className="text-base saturate-[.6]">{chip.emoji}</span>
        {chip.label}
        {chip.count !== undefined && <span className="font-mono text-xs font-normal opacity-70">{chip.count}</span>}
      </button>
    );
  }
  return (
    <button {...common} onClick={() => onPick({ keyword: chip.label })} className={`${CHIP_BASE} mt-[3px] h-[38px] rounded-[13px] bg-white/35 font-mono text-sm font-medium`}>
      {chip.label}
    </button>
  );
}

// Background of the hero: six lanes drifting in alternate directions. Each lane
// is rendered twice so translateX(-50%) loops seamlessly. Mouse-only shortcut:
// every chip's filter is also in the search bar and sidebar, so the wall stays
// out of the tab order and the accessibility tree.
export function HeroWall({ categoryCounts, onPick }: HeroWallProps) {
  const lanes = buildHeroLanes(categoryCounts, HERO_KEYWORDS);
  return (
    <div className="hero-wall" aria-hidden>
      {lanes.map((lane, l) => (
        <div
          key={l}
          className="hero-lane"
          data-reverse={l % 2 === 1 ? '' : undefined}
          style={{ '--d': `${70 + l * 9}s` } as React.CSSProperties}
        >
          {[0, 1].map((copy) =>
            lane.map((chip, i) => <Chip key={`${copy}-${i}`} chip={chip} onPick={onPick} />),
          )}
        </div>
      ))}
    </div>
  );
}
