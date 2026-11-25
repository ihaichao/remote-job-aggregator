import Link from 'next/link';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const SOURCE_PALETTE = [
  '#ff5a1f',
  '#18181b',
  '#f59e0b',
  '#0d9488',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

function formatPercent(value: number, total: number) {
  if (!total) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function shortWeekLabel(label: string) {
  const match = /^\d{4}-(\d{2}-\d{2})$/.exec(label.trim());
  return match ? match[1] : label;
}

export function WeeklyTrendChart({
  data,
  title = '近八周在招职位发布趋势',
}: {
  data: { label: string; count: number }[];
  title?: string;
}) {
  const width = 680;
  const height = 220;
  const pad = { top: 28, right: 24, bottom: 34, left: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const rawMax = Math.max(1, ...data.map((d) => d.count));
  const tickStep = Math.max(1, Math.ceil(rawMax / 4));
  const yMax = tickStep * 4;
  const ticks = [0, tickStep, tickStep * 2, tickStep * 3, yMax];

  const points = data.map((item, idx) => {
    const x =
      data.length === 1
        ? pad.left + plotW / 2
        : pad.left + (idx / (data.length - 1)) * plotW;
    const y = pad.top + plotH - (item.count / yMax) * plotH;
    return { ...item, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
      : '';

  return (
    <section className="editorial-panel">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <span className="text-xs text-muted-foreground">按自然周统计（周一起始）</span>
      </div>
      {points.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">暂无趋势数据。</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
            className="h-auto w-full min-w-[460px]"
          >
            <defs>
              <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {ticks.map((tick) => {
              const y = pad.top + plotH - (tick / yMax) * plotH;
              return (
                <g key={tick}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    stroke="#e7dfd5"
                    strokeDasharray={tick === 0 ? undefined : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#78716c"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {points.length > 1 && <path d={areaPath} fill="url(#trendAreaFill)" />}
            {points.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="#ff5a1f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {points.map((p) => (
              <g key={p.label}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#ff5a1f" strokeWidth="2.5">
                  <title>{`${p.label}：${p.count} 个职位`}</title>
                </circle>
                <text
                  x={p.x}
                  y={p.y - 11}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#18181b"
                >
                  {p.count}
                </text>
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#78716c"
                >
                  {shortWeekLabel(p.label)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}

export function DonutChart({
  title,
  centerLabel,
  segments,
}: {
  title: string;
  centerLabel: string;
  segments: DonutSegment[];
}) {
  const positive = segments.filter((s) => s.value > 0);
  const total = positive.reduce((sum, s) => sum + s.value, 0);
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <section className="editorial-panel">
      <h2 className="section-title">{title}</h2>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">暂无统计数据。</p>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative h-40 w-40 flex-none">
            <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title} className="h-full w-full -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f5efe6"
                strokeWidth={strokeWidth}
              />
              {positive.map((seg) => {
                const length = (seg.value / total) * circumference;
                const dashArray = `${length} ${circumference - length}`;
                const dashOffset = -offset;
                offset += length;
                return (
                  <circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  >
                    <title>{`${seg.label}：${seg.value}（${formatPercent(seg.value, total)}）`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tabular-nums text-ink">{total}</span>
              <span className="text-xs text-muted-foreground">{centerLabel}</span>
            </div>
          </div>

          <ul className="w-full flex-1 space-y-3 text-sm">
            {positive.map((seg) => (
              <li key={seg.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-ink">
                  <span
                    className="h-3 w-3 flex-none rounded-full"
                    style={{ backgroundColor: seg.color }}
                    aria-hidden
                  />
                  <span>{seg.label}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <strong className="font-semibold text-ink">{seg.value}</strong> · {formatPercent(seg.value, total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function SourceBreakdownChart({
  rows,
  title = '岗位来源构成',
}: {
  rows: { label: string; count: number }[];
  title?: string;
}) {
  const positive = rows.filter((r) => r.count > 0);
  const total = positive.reduce((sum, r) => sum + r.count, 0);

  return (
    <section className="editorial-panel">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <span className="text-xs text-muted-foreground">共 {positive.length} 个活跃渠道</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">暂无来源数据。</p>
      ) : (
        <div className="space-y-4">
          <div
            className="flex h-5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={title}
          >
            {positive.map((row, index) => (
              <div
                key={row.label}
                style={{
                  width: `${(row.count / total) * 100}%`,
                  backgroundColor: SOURCE_PALETTE[index % SOURCE_PALETTE.length],
                }}
                title={`${row.label}：${row.count}（${formatPercent(row.count, total)}）`}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {positive.map((row, index) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 rounded-xl border border-line bg-cream/60 px-3.5 py-2.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-full"
                    style={{ backgroundColor: SOURCE_PALETTE[index % SOURCE_PALETTE.length] }}
                    aria-hidden
                  />
                  <span className="truncate font-medium text-ink">{row.label}</span>
                </span>
                <span className="flex-none tabular-nums text-xs text-muted-foreground">
                  <strong className="font-semibold text-ink">{row.count}</strong> ({formatPercent(row.count, total)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function CategoryBarChart({
  rows,
  totalJobs,
  title = '技术方向分布',
}: {
  rows: { label: string; count: number; href: string }[];
  totalJobs: number;
  title?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className="editorial-panel">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <span className="text-xs text-muted-foreground">点击方向进入专题页</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无分类数据。</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, idx) => (
            <li key={row.label}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <Link className="text-link font-medium" href={row.href}>
                  {row.label}
                </Link>
                <span className="tabular-nums text-xs text-muted-foreground">
                  <strong className="text-sm font-semibold text-ink">{row.count}</strong> · {formatPercent(row.count, totalJobs)}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(row.count / max) * 100}%`,
                    backgroundColor: idx < 3 ? '#ff5a1f' : '#fb923c',
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TagHeatCloud({
  tags,
  title = '热门技术标签热度',
}: {
  tags: { tag: string; count: number }[];
  title?: string;
}) {
  const max = Math.max(1, ...tags.map((t) => t.count));

  return (
    <section className="editorial-panel">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <span className="text-xs text-muted-foreground">点击标签筛选相关职位</span>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无标签数据。</p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {tags.map((item) => {
            const ratio = item.count / max;
            const tierClass =
              ratio >= 0.7
                ? 'border-orange bg-orange text-white text-sm font-semibold px-3.5 py-1.5'
                : ratio >= 0.4
                  ? 'border-orange/40 bg-peach text-ink text-sm font-medium px-3 py-1.5'
                  : 'border-line bg-cream text-ink/85 text-xs font-medium px-2.5 py-1';
            return (
              <Link
                key={item.tag}
                href={`/?keyword=${encodeURIComponent(item.tag)}`}
                className={`inline-flex items-center gap-1.5 rounded-full border transition hover:border-ink ${tierClass}`}
              >
                <span>{item.tag}</span>
                <span className={ratio >= 0.7 ? 'text-white/85 tabular-nums' : 'text-muted-foreground tabular-nums'}>
                  {item.count}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
