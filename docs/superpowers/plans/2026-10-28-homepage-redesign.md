# 首页 UI 改版实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按定稿视觉稿重做首页（桃色首屏 + 漂移标签背景 + 分段搜索栏 + 筛选栏 + 加载更多 + 极简页脚），并把新主题套到全站。

**Architecture:** 后端新增 `GET /api/jobs/stats` 统计接口，并把关键词搜索扩展到技术标签。前端首页由服务端读取网址参数、预取职位和统计，交给一个客户端容器 `JobBoard` 管理筛选、加载更多和网址同步。首屏背景是纯 CSS 动画，标签本身是链接。纯逻辑（网址参数、时间格式、背景行生成、后端查询条件）用 Vitest 做单元测试，视觉部分在浏览器里按固定尺寸核对。

**Tech Stack:** Next.js 14 App Router、Tailwind 3、next/font、NestJS 10、Prisma 5、PostgreSQL、Vitest（新增）

**Spec:** [docs/superpowers/specs/2026-10-28-homepage-redesign-design.md](../specs/2026-10-28-homepage-redesign-design.md)，视觉以 [2026-10-28-homepage-redesign-mockup.html](../specs/2026-10-28-homepage-redesign-mockup.html) 为准（规格里写明的修改优先于视觉稿）。

## Global Constraints

- 颜色 token：peach `#ffd9b8`、peach-2 `#ffe8d4`、cream `#fffaf5`、ink `#0a0a0a`、muted `#6b7080`、sep `#a1a1a1`、line `#e9ddd1`、orange `#ff8a1f`。
- 字体：Space Grotesk（300/400/500/600/700）+ Noto Sans SC（300/400/500/600/700）+ JetBrains Mono；移除 Source Sans 3 和 Calistoga。
- 文字层级严格按规格"文字规范"表，各处字号、字重、颜色照抄。
- UI 文案全部中文；首屏标题"为中国开发者找远程工作"，副标题"聚合全网远程开发岗位，AI 自动分类。前端、后端、AI、Web3，一处搜完。"
- 首页不出现"发布职位""订阅更新"；卡片标题后面不放箭头。
- 每页 20 条；桌面 1280 宽时首屏背景区高约 315px；375 宽时 `document.documentElement.scrollWidth === 375`。
- 地域选项：不限 / 🌍 全球（`worldwide`）/ 🇨🇳 中国（`CN`）；工作性质：不限 / 全职（`fulltime`）/ 兼职（`parttime`），都是单选。
- 统计数量是全站总数，不随筛选变化；统计接口缓存 5 分钟。
- 首页首批职位必须服务端渲染；任何接口失败都不能让页面崩溃。
- 遵守 `prefers-reduced-motion: reduce`：首屏背景不漂移。

## Review Focus

1. **网址参数不合法**（`?page=abc`、`?page=0`、`?page=9999`、`?category=xyz`、`?regionLimit=US`）：回退到默认值，页码夹在 1 到 10 之间，页面正常渲染。由 Task 3 的测试覆盖。
2. **关键词含特殊字符或只有空白**（`' or 1=1 --`、`%`、`   `）：关键词按普通文本处理，标签匹配用参数化 SQL，空白关键词等于没填。由 Task 1 的测试覆盖。
3. **连点"加载更多"，或加载中途改了筛选**：不出现重复职位，旧请求的结果被丢弃。由 Task 3 的 `mergeJobs` 测试和 Task 7 的请求序号守卫覆盖。
4. **统计接口挂了或后端整个不可用**：首屏照常显示，只是不带数量；列表为空时显示空状态。由 Task 5 的测试覆盖。
5. **新标签页直接打开 `?page=3` 的链接**：服务端一次渲染出前 60 条，"已显示 60 / N"显示正确。由 Task 7 的手动核对步骤覆盖。

---

## 文件结构

**后端 `apps/backend`**
- 修改 `src/jobs/jobs.service.ts`：关键词同时匹配标题和标签；新增 `getStats()`。
- 修改 `src/jobs/jobs.controller.ts`：新增 `@Get('stats')`，放在 `@Get(':id')` 之前。
- 新建 `src/jobs/job-stats.ts`：`JobStats` 类型。
- 新建 `test/jobs.service.test.ts`、`vitest.config.ts`、`tsconfig.build.json`。

**前端 `apps/web`**
- 新建 `src/lib/listQuery.ts`：网址参数与筛选状态互转、合并职位。
- 新建 `src/lib/time.ts`：`formatTimeAgo`、`isFresh`（从 `JobCard.tsx` 移出）。
- 新建 `src/lib/categoryMeta.ts`：每个分类的 emoji 和浅色底。
- 新建 `src/lib/heroLanes.ts`：生成首屏背景各行标签。
- 修改 `src/lib/api.ts`：`JobStats` 类型、`getJobStats`、`getServerJobStats`。
- 修改 `src/lib/constants.ts`：新增 `HERO_KEYWORDS`、`REGION_OPTIONS`、`WORK_TYPE_OPTIONS`。
- 修改 `src/app/globals.css`、`tailwind.config.js`、`src/app/layout.tsx`：主题 token 和字体。
- 新建 `src/components/Logo.tsx`、`src/app/icon.svg`、`src/app/opengraph-image.tsx`。
- 重写 `src/components/SiteHeader.tsx`、`src/components/SiteFooter.tsx`。
- 修改 `src/components/PageShell.tsx`、`src/app/jobs/[id]/page.tsx`：换主题 class。
- 新建 `src/components/home/JobBoard.tsx`（客户端容器）、`HeroWall.tsx`、`SearchBar.tsx`、`FilterSidebar.tsx`、`LoadMore.tsx`。
- 重写 `src/components/JobCard.tsx`。
- 修改 `src/app/page.tsx`。
- 删除 `src/components/Filters.tsx`、`src/components/JobList.tsx`、`src/components/ui/pagination.tsx`。
- 新建 `vitest.config.ts`，测试文件和被测文件放在一起（`src/lib/*.test.ts`）。

---

### Task 1：关键词搜索覆盖技术标签（顺带搭好后端测试环境）

**Files:**
- Modify: `apps/backend/package.json`（devDependency `vitest@^1.6.0`，script `"test": "vitest run"`）
- Create: `apps/backend/vitest.config.ts`（`test.include: ['test/**/*.test.ts']`）
- Create: `apps/backend/tsconfig.build.json`（`{"extends": "./tsconfig.json", "exclude": ["node_modules", "dist", "test", "vitest.config.ts"]}`，保证 `nest build` 产物仍是 `dist/main.js`）
- Modify: `apps/backend/src/jobs/jobs.service.ts`
- Test: `apps/backend/test/jobs.service.test.ts`

**Interfaces:**
- Produces: `JobsService.findAll` 的签名和返回值不变，只是关键词匹配更宽；`JobsService` 构造参数仍是 `PrismaService`（测试里传一个只实现 `job.findMany`、`job.count`、`$queryRaw` 的假对象）。

- [ ] **Step 1：写失败的测试**

```ts
// test/jobs.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { JobsService } from '../src/jobs/jobs.service';

function fakePrisma(tagMatchIds: number[] = []) {
  return {
    job: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    $queryRaw: vi.fn().mockResolvedValue(tagMatchIds.map((id) => ({ id }))),
  } as any;
}

describe('findAll keyword', () => {
  it('matches title or ids whose tags equal the keyword case-insensitively', async () => {
    const prisma = fakePrisma([7, 9]);
    await new JobsService(prisma).findAll({ keyword: ' React ' });
    const where = prisma.job.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { title: { contains: 'React', mode: 'insensitive' } },
      { id: { in: [7, 9] } },
    ]);
    // keyword is passed as a bound parameter, never spliced into SQL text
    const sqlArg = prisma.$queryRaw.mock.calls[0][0];
    expect(sqlArg.values).toContain('React');
  });

  it('treats whitespace-only keyword as no keyword', async () => {
    const prisma = fakePrisma();
    await new JobsService(prisma).findAll({ keyword: '   ' });
    expect(prisma.job.findMany.mock.calls[0][0].where.OR).toBeUndefined();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('keeps SQL-looking input as plain text', async () => {
    const prisma = fakePrisma();
    await new JobsService(prisma).findAll({ keyword: "' or 1=1 --" });
    expect(prisma.$queryRaw.mock.calls[0][0].values).toContain("' or 1=1 --");
  });
});
```

- [ ] **Step 2：运行，确认失败**

Run: `pnpm --filter @remote/backend install && pnpm --filter @remote/backend test`
Expected: FAIL，`where.OR` 是 undefined（现在只按 `where.title` 过滤）。

- [ ] **Step 3：在 `findAll` 里实现标签匹配**

关键词 `trim()` 后为空就跳过。否则先用 `this.prisma.$queryRaw(Prisma.sql`…`)`（传 `Sql` 对象，测试依赖它的 `.values`）查出 `SELECT id FROM jobs WHERE is_active AND EXISTS (SELECT 1 FROM unnest(tags) t WHERE lower(t) = lower(${keyword}))`，再设 `where.OR = [{ title: { contains, mode: 'insensitive' } }, { id: { in: ids } }]`，同时删掉原来的 `where.title`。

- [ ] **Step 4：运行，确认通过**

Run: `pnpm --filter @remote/backend test`
Expected: 3 passed

- [ ] **Step 5：确认构建产物路径没变**

Run: `pnpm --filter @remote/backend build && test -f apps/backend/dist/main.js && echo OK`
Expected: `OK`

- [ ] **Step 6：提交**

```bash
git add apps/backend pnpm-lock.yaml
git commit -m "feat(backend): keyword search also matches job tags"
```

---

### Task 2：统计接口 `GET /api/jobs/stats`

**Files:**
- Create: `apps/backend/src/jobs/job-stats.ts`
- Modify: `apps/backend/src/jobs/jobs.service.ts`、`apps/backend/src/jobs/jobs.controller.ts`
- Test: `apps/backend/test/jobs.service.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface JobStats {
    total: number;                         // 在招职位总数
    categories: Record<string, number>;    // 分类 -> 数量，不含 'other'
    regions: Record<string, number>;       // 只含 'worldwide'、'CN'
    workTypes: Record<string, number>;     // 只含 'fulltime'、'parttime'
    lastSyncedAt: string | null;           // 在招职位里最大的 updatedAt，ISO 字符串
  }
  JobsService.getStats(): Promise<JobStats>
  ```
  `GET /api/jobs/stats` 原样返回 `JobStats`。

- [ ] **Step 1：写失败的测试**

```ts
describe('getStats', () => {
  function statsPrisma() {
    return {
      job: {
        count: vi.fn().mockResolvedValue(417),
        groupBy: vi.fn()
          .mockResolvedValueOnce([{ regionLimit: 'worldwide', _count: { _all: 238 } }, { regionLimit: 'CN', _count: { _all: 120 } }, { regionLimit: 'US', _count: { _all: 59 } }])
          .mockResolvedValueOnce([{ workType: 'fulltime', _count: { _all: 380 } }, { workType: 'parttime', _count: { _all: 30 } }, { workType: 'contract', _count: { _all: 7 } }]),
        aggregate: vi.fn().mockResolvedValue({ _max: { updatedAt: new Date('2026-10-28T08:00:00Z') } }),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ category: 'ai', count: 64n }, { category: 'other', count: 3n }]),
    } as any;
  }

  it('returns site-wide counts limited to the options the UI offers', async () => {
    const stats = await new JobsService(statsPrisma()).getStats();
    expect(stats).toEqual({
      total: 417,
      categories: { ai: 64 },
      regions: { worldwide: 238, CN: 120 },
      workTypes: { fulltime: 380, parttime: 30 },
      lastSyncedAt: '2026-10-28T08:00:00.000Z',
    });
  });

  it('caches the result for 5 minutes', async () => {
    vi.useFakeTimers();
    const prisma = statsPrisma();
    const service = new JobsService(prisma);
    await service.getStats();
    await service.getStats();
    expect(prisma.job.count).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    prisma.job.groupBy.mockResolvedValue([]);
    await service.getStats();
    expect(prisma.job.count).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2：运行，确认失败**

Run: `pnpm --filter @remote/backend test`
Expected: FAIL，`getStats is not a function`。

- [ ] **Step 3：实现 `getStats()`**

所有查询都只统计 `isActive: true`。分类数量用 `$queryRaw`：`SELECT c AS category, count(*) AS count FROM jobs, unnest(category) c WHERE is_active GROUP BY c`，返回的 bigint 要转成 number。地域和工作性质用 `job.groupBy` 统计，然后只保留 `worldwide`/`CN` 和 `fulltime`/`parttime`。`lastSyncedAt` 取 `job.aggregate({ _max: { updatedAt } })`。结果缓存在实例字段里，带过期时间 `Date.now() + 300_000`。

- [ ] **Step 4：在控制器加路由**

`@Get('stats') stats() { return this.jobsService.getStats(); }` 必须写在 `@Get(':id')` 之前。

- [ ] **Step 5：运行测试，并实际请求一次**

Run: `pnpm --filter @remote/backend test`
Expected: 5 passed

Run（本地起后端，并连上有数据的库）: `curl -s localhost:4000/api/jobs/stats`
Expected: 返回 JSON，包含 `total`、`categories`、`regions`、`workTypes`、`lastSyncedAt` 五个键；`/api/jobs/123` 照常可用。

- [ ] **Step 6：提交**

```bash
git add apps/backend
git commit -m "feat(backend): add GET /api/jobs/stats with 5-minute cache"
```

---

### Task 3：网址参数与列表状态（顺带搭好前端测试环境）

**Files:**
- Modify: `apps/web/package.json`（devDependency `vitest@^1.6.0`，script `"test": "vitest run"`）
- Create: `apps/web/vitest.config.ts`（`resolve.alias: { '@': path.resolve(__dirname, 'src') }`，`test.include: ['src/**/*.test.ts']`）
- Create: `apps/web/src/lib/listQuery.ts`
- Test: `apps/web/src/lib/listQuery.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const PAGE_SIZE = 20;
  export const MAX_RESTORE_PAGE = 10;
  export interface ListQuery { keyword: string; category: string; regionLimit: string; workType: string; page: number }
  export const EMPTY_QUERY: ListQuery; // 字符串都是 ''，page 为 1
  export function parseListQuery(params: Record<string, string | string[] | undefined>): ListQuery
  export function serializeListQuery(q: ListQuery): string   // 不带 '?'；空值和 page=1 都省略
  export function mergeJobs<T extends { id: number }>(existing: T[], incoming: T[]): T[] // 按 id 去重，保持原顺序
  ```

- [ ] **Step 1：写失败的测试**

```ts
import { describe, it, expect } from 'vitest';
import { parseListQuery, serializeListQuery, mergeJobs, EMPTY_QUERY } from './listQuery';

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
```

- [ ] **Step 2：运行，确认失败**

Run: `pnpm --filter @remote/web install && pnpm --filter @remote/web test`
Expected: FAIL，找不到模块 `./listQuery`。

- [ ] **Step 3：实现 `listQuery.ts`**

分类的合法值取自 `@remote/shared` 的 `JOB_CATEGORY_LABELS`（不含 `other`）。地域的合法值是 `worldwide`、`CN`，工作性质是 `fulltime`、`parttime`。

- [ ] **Step 4：运行，确认通过**

Run: `pnpm --filter @remote/web test`
Expected: 6 passed

- [ ] **Step 5：提交**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): URL-backed list query helpers"
```

---

### Task 4：时间格式、分类样式、首屏背景行

**Files:**
- Create: `apps/web/src/lib/time.ts`、`apps/web/src/lib/categoryMeta.ts`、`apps/web/src/lib/heroLanes.ts`
- Modify: `apps/web/src/lib/constants.ts`
- Test: `apps/web/src/lib/time.test.ts`、`apps/web/src/lib/heroLanes.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // time.ts
  export function formatTimeAgo(iso: string, now?: Date): string // 刚刚 / N 分钟前 / N 小时前 / N 天前（<7 天）/ zh-CN 日期
  export function isFresh(iso: string, now?: Date): boolean        // 24 小时内
  // categoryMeta.ts
  export const CATEGORY_META: Record<string, { emoji: string; tint: string }>
  // constants.ts
  export const HERO_KEYWORDS: string[]
  export const REGION_OPTIONS: { value: string; label: string }[]     // [{'' ,'不限'},{'worldwide','🌍 全球'},{'CN','🇨🇳 中国'}]
  export const WORK_TYPE_OPTIONS: { value: string; label: string }[]  // [{'' ,'不限'},{'fulltime','全职'},{'parttime','兼职'}]
  // heroLanes.ts
  export type HeroChip = { kind: 'category'; key: string; label: string; emoji: string; count?: number } | { kind: 'keyword'; label: string };
  export function buildHeroLanes(categoryCounts: Record<string, number>, keywords: string[], laneCount?: number, perLane?: number): HeroChip[][]
  ```
- `CATEGORY_META` 的 13 个分类（不含 other）照抄视觉稿 `CATS` 数组的 emoji 和底色：ai 🤖 `#ffe7d1`、backend 🧱 `#e3f0ff`、frontend 🎨 `#ffe3ef`、fullstack 🧩 `#e9f7e3`、blockchain ⛓️ `#f1e8ff`、devops ☁️ `#e0f6f7`、mobile 📱 `#fff3cc`、game 🎮 `#ffe1e1`、quant 📈 `#e6f0e6`、security 🛡️ `#ececec`、testing 🧪 `#f6eadf`、data 📊 `#e3ecff`、embedded 🔌 `#f0f0e0`。
- `HERO_KEYWORDS` 照抄视觉稿的 `KW` 数组（React、Go、Python…Swift，共 20 个）。

- [ ] **Step 1：写失败的测试**

```ts
// time.test.ts
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

// heroLanes.test.ts
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
```

- [ ] **Step 2：运行，确认失败**

Run: `pnpm --filter @remote/web test`
Expected: FAIL，找不到模块。

- [ ] **Step 3：实现三个模块**

`buildHeroLanes` 的排布照抄视觉稿：第 `l` 行的第 `i` 个，`(i + l)` 为偶数时放分类 `CATS[(i*2 + l*3) % 13]`，为奇数时放关键词 `KW[(i*3 + l*5) % KW.length]`。分类顺序按 `CATEGORY_META` 的键顺序，标签文字用 `JOB_CATEGORY_LABELS`。`JobCard.tsx` 里的 `getTimeAgo` 改为调用 `formatTimeAgo`。

- [ ] **Step 4：运行，确认通过**

Run: `pnpm --filter @remote/web test`
Expected: 全部通过

- [ ] **Step 5：提交**

```bash
git add apps/web/src/lib apps/web/src/components/JobCard.tsx
git commit -m "feat(web): time, category meta and hero lane helpers"
```

---

### Task 5：前端统计接口客户端

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Test: `apps/web/src/lib/api.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `JobStats` 结构（在前端重新声明，不跨包引用）。
- Produces: `export interface JobStats`、`export const EMPTY_STATS: JobStats`（数量全为 0 或空对象，`lastSyncedAt: null`）、`getServerJobStats(): Promise<JobStats>`（失败返回 `EMPTY_STATS`，不抛错）、`getJobStats(): Promise<JobStats>`。

- [ ] **Step 1：写失败的测试**

```ts
import { vi, it, expect } from 'vitest';
import { getServerJobStats, EMPTY_STATS } from './api';

it('returns EMPTY_STATS when the backend is down', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
  await expect(getServerJobStats()).resolves.toEqual(EMPTY_STATS);
});
it('returns EMPTY_STATS on non-2xx', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
  await expect(getServerJobStats()).resolves.toEqual(EMPTY_STATS);
});
```

- [ ] **Step 2：运行，确认失败**

Run: `pnpm --filter @remote/web test`
Expected: FAIL，`getServerJobStats` 不存在。

- [ ] **Step 3：实现**

写法照现有的 `getServerJobs`：请求 `${SERVER_API_BASE}/jobs/stats`，`next: { revalidate: 300 }`。

- [ ] **Step 4：运行，确认通过**

Run: `pnpm --filter @remote/web test`
Expected: 全部通过

- [ ] **Step 5：提交**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/api.test.ts
git commit -m "feat(web): job stats API client"
```

---

### Task 6：全站主题、Logo、导航、页脚

**Files:**
- Modify: `apps/web/src/app/globals.css`、`apps/web/tailwind.config.js`、`apps/web/src/app/layout.tsx`
- Create: `apps/web/src/components/Logo.tsx`、`apps/web/src/app/icon.svg`、`apps/web/src/app/opengraph-image.tsx`
- Modify: `apps/web/src/components/SiteHeader.tsx`、`apps/web/src/components/SiteFooter.tsx`、`apps/web/src/components/PageShell.tsx`、`apps/web/src/app/jobs/[id]/page.tsx`、`apps/web/src/components/ui/badge.tsx`
- Delete: `public/favicon.png`，并删掉 `layout.tsx` 里的 `icons`；以及 `openGraph.images` / `twitter.images` 里对 `/og-image.png` 的引用（这个文件本来就不存在，改由 `opengraph-image.tsx` 生成）

**Interfaces:**
- Produces: Tailwind 颜色 `peach`、`peach-2`、`cream`、`ink`、`muted`、`sep`、`line`、`orange`（直接是十六进制值）；字体变量 `--font-sans`（Space Grotesk + Noto Sans SC）、`--font-mono`（JetBrains Mono）；`<Logo size?: 'md' | 'sm' />`；`<SiteHeader />`（首页和内页共用）；`<SiteFooter />`。工具类 `.btn-primary`（`@layer components`：橙底、2px ink 描边、圆角 10px、`box-shadow: 0 3px 0 ink`，悬停时 `translateY(1px)` 且阴影变 2px）。

- [ ] **Step 1：主题 token 和字体**

在 `layout.tsx` 用 `next/font/google` 引入 `Space_Grotesk`（weight 300–700）、`Noto_Sans_SC`（weight 300/400/500/600/700，`preload: false`，交给 Google 的 unicode-range 分片按需加载）、`JetBrains_Mono`；移除 Source Sans 3 和 Calistoga。`globals.css` 里把 body 底色设为 cream、字色 ink、字重 400，去掉 `h1,h2,h3` 的衬线字体；旧的 shadcn 变量（`--accent` 等）改指向新配色，避免内页残留蓝色。

- [ ] **Step 2：Logo、导航、页脚**

- Logo：`remote` 后跟贴纸 `<em>cn</em>`。md 尺寸字标 24px/700/字间距 -0.04em，贴纸 20px；sm 尺寸字标 20px、贴纸 16px。贴纸样式：orange 底、2px ink 描边、圆角 8px、`0 3px 0` ink 阴影、`rotate(-4deg)`，悬停时 `rotate(3deg)`。
- 导航：吸顶，高 64px，`rgba(255,217,184,.85)` 加 `backdrop-blur`，底部 1px `rgba(10,10,10,.08)` 分隔线。左边 Logo，右边"职位 · 关于 · 联系我们"，14px/400/ink，间距 26px（手机 18px），手机端也显示。
- 页脚：一行居中，内容为 `© 2025–2026 remotecn` + sep 色"·" + "隐私政策"链接，12px muted，上下内边距 14px，上方 1px line 分隔线，`margin-top: 40px`。
- `icon.svg`：32×32，橙底圆角方块，2.5px ink 描边，旋转 -6°，中间 ink 色 "cn"。`opengraph-image.tsx`：1200×630 桃色渐变底，大号 Logo 加首屏标题。

- [ ] **Step 3：内页换主题**

`PageShell` 和详情页去掉 `font-serif`、`text-accent` 等旧 class，链接改成 ink 色加 orange 下划线。`badge.tsx` 的 `category` 变体改成 peach 底、ink 字，`tag` 变体改成 line 描边、muted 字、等宽 11px。详情页只换颜色和字体，不动布局。

- [ ] **Step 4：构建并目测内页**

Run: `pnpm --filter @remote/web build`
Expected: 构建成功，没有类型错误。

Run: `pnpm --filter @remote/web dev`，在浏览器里打开 `/about`、`/privacy`、`/jobs/<任意 id>`
Expected: 新导航和页脚生效，页面里没有蓝色残留，标题用 Space Grotesk 或思源黑体，标签页图标是橙色 cn 贴纸。

- [ ] **Step 5：提交**

```bash
git add -A apps/web
git commit -m "feat(web): new theme, sticker logo, header and footer"
```

---

### Task 7：首页列表区、加载更多、网址同步

**Files:**
- Create: `apps/web/src/components/home/JobBoard.tsx`、`FilterSidebar.tsx`、`LoadMore.tsx`
- Modify: `apps/web/src/components/JobCard.tsx`、`apps/web/src/app/page.tsx`
- Delete: `apps/web/src/components/Filters.tsx`、`apps/web/src/components/JobList.tsx`、`apps/web/src/components/ui/pagination.tsx`

**Interfaces:**
- Consumes: Task 3 的 `ListQuery`/`parseListQuery`/`serializeListQuery`/`mergeJobs`/`PAGE_SIZE`；Task 4 的 `formatTimeAgo`/`isFresh`/`CATEGORY_META`/`REGION_OPTIONS`/`WORK_TYPE_OPTIONS`；Task 5 的 `JobStats`/`getServerJobStats`。
- Produces:
  ```ts
  // JobBoard.tsx（'use client'）
  export function JobBoard(props: { initialQuery: ListQuery; initialJobs: Job[]; initialTotal: number; stats: JobStats }): JSX.Element
  // 对 Task 8 暴露：JobBoard 内部提供 setQuery(patch: Partial<ListQuery>)，作为 prop 传给 <Hero onSearch={...} />
  ```

- [ ] **Step 1：`page.tsx` 服务端预取**

`Home({ searchParams })`：`const q = parseListQuery(searchParams)`。对第 1 页到第 `q.page` 页并发调用 `getServerJobs({ ...filters, page: i, limit: PAGE_SIZE })`，结果用 `mergeJobs` 拼起来。同时调用 `getServerJobStats()`。最后渲染 `<SiteHeader/><JobBoard …/><SiteFooter/>`。

- [ ] **Step 2：`JobBoard` 的状态和网址同步**

- 状态：`query`、`jobs`、`total`、`loading`、`error`。
- 筛选变化（除 page 外任意字段变化）时，page 重置为 1，拉取第 1 页并替换列表。
- 点"加载更多"时，拉取 `page + 1`，用 `mergeJobs` 追加到列表。
- 每次 `query` 变化都调用 `router.replace('?' + serializeListQuery(query), { scroll: false })`。
- 每个请求带一个递增序号，返回时序号不是最新的就丢弃，避免旧结果覆盖新结果。
- 加载中按钮置为禁用。
- 空结果、出错的文案沿用现在 `JobList` 的。

- [ ] **Step 3：`FilterSidebar`**

- 桌面端：宽 250px，`position: sticky; top: 88px`。
- 顶部一行：左边"N 个职位"，数字 14px/600/ink，后面文字 muted；右边"✕ 清除筛选"，14px/500/muted，点击后回到 `EMPTY_QUERY`。
- 筛选分组依次为：职位方向（全部 + 13 个分类，按 `stats.categories` 的数量从多到少排序）、地域、工作性质。
  - 分组标题 16px/600。
  - 选项 14px/400/muted，数量 11px sep 色、等宽字体。
  - 选中项 ink 色、字重 500、白底，加 `inset 0 0 0 1.5px` ink 描边。
- 手机端（<860px）：只显示职位方向，排成一行，可横向滚动。容器加 `min-width: 0`，防止把页面撑宽。

- [ ] **Step 4：`JobCard` 按视觉稿重写**

- 外框：白底、1px line 边框、圆角 18px、内边距 22px，三列网格 `56px 1fr auto`。
- 左列：56px 方块，`CATEGORY_META[第一个分类]` 的底色和 emoji，圆角 14px。
- 中列，从上到下：
  - 标题 18px/700，后面不带箭头。
  - 公司名 16px/500，有才显示。
  - 描述：`markdownToPlainText` 处理后的纯文本，两行截断，14px/20px/muted。
  - 地域和性质用 `getRegionLabel` 和 `WORK_TYPE_LABELS`，格式为"地域 · 性质"，大写，12px/500/muted。
  - 分类标签用 `JOB_CATEGORY_LABELS` 加分类底色，12px/500；之后是最多 5 个技术标签，等宽 11px muted，line 描边。
- 右列：
  - 上方 `formatTimeAgo`，12px muted；`isFresh` 时显示为绿色 `#15803d`、字重 500，前面加 "● "。
  - 下方"via 来源"，用 `SOURCE_LABELS`，12px muted，`#f7f1eb` 底。
- 悬停：ink 描边、`0 4px 0` ink 阴影、上浮 2px。
- 整张卡片是指向 `/jobs/:id` 的 `<Link>`。
- 手机端：图标缩到 44px，右列移到中列下方。

- [ ] **Step 5：`LoadMore`**

从上到下：
1. 220×4px 进度条：line 色底，orange 色填充，宽度为 已加载 / 总数。
2. 文案"已显示 **N** / 总数 个职位"，14px muted，N 用 ink 色、字重 600。
3. 按钮"加载更多职位"，用 `.btn-primary`，内边距 10px 26px。

全部加载完后，进度条和文案保留，按钮换成 muted 色文字"已经到底了"。

- [ ] **Step 6：列表头**

左边"排序：最新发布"，"最新发布"字重 500，没有下拉箭头。右边"最近同步 X 分钟前"，用 `formatTimeAgo(stats.lastSyncedAt)`；`lastSyncedAt` 为 null 时不显示。两边都是 14px muted。

- [ ] **Step 7：核对**

Run: `pnpm --filter @remote/web test && pnpm --filter @remote/web build`
Expected: 测试全部通过，构建成功。

在本地 dev 环境里依次核对：
- 选"后端开发"后，网址变成 `?category=backend`。
- 点两次"加载更多"后，网址变成 `&page=3`，"已显示 60 / N"正确。
- 点进任一职位再按浏览器"返回"，列表还是 60 条，滚动位置大致回到原处。
- 把 `?category=backend&page=3` 粘到新标签页打开，服务端直接渲染出 60 条（查看网页源代码能看到第 60 条的标题）。
- 打开 `?page=abc&category=xyz`，页面正常显示全部职位。
- 快速连点"加载更多"，列表里没有重复卡片。

- [ ] **Step 8：提交**

```bash
git add -A apps/web
git commit -m "feat(web): homepage list with sidebar, load more and URL state"
```

---

### Task 8：首屏（漂移背景 + 分段搜索栏）

**Files:**
- Create: `apps/web/src/components/home/Hero.tsx`、`HeroWall.tsx`、`SearchBar.tsx`
- Modify: `apps/web/src/components/home/JobBoard.tsx`（在列表区上方渲染 `<Hero>`）

**Interfaces:**
- Consumes: Task 4 的 `buildHeroLanes`、`HERO_KEYWORDS`、`REGION_OPTIONS`、`WORK_TYPE_OPTIONS`；Task 7 的 `setQuery`。
- Produces:
  ```ts
  export function Hero(props: { query: ListQuery; stats: JobStats; total: number; onSearch: (patch: Partial<ListQuery>) => void }): JSX.Element
  ```

- [ ] **Step 1：`HeroWall`**

- 用 `buildHeroLanes(stats.categories, HERO_KEYWORDS)` 生成 6 行。容器绝对定位铺满首屏，`top: -10px`，`rotate(-3deg) scale(1.08)`，行与行间距 12px。
- 每行把标签渲染两遍，用 `translateX(0 → -50%)` 做无缝循环，周期 `70 + 9×行号` 秒，奇数行反向。
- 分类标签：高 44px，左右内边距 16px，圆角 13px，`rgba(255,255,255,.55)` 底，17px/700。依次显示 emoji、分类名、数量（等宽 12px，透明度 .7）。
- 关键词标签：高 38px，等宽 14px/500，`rgba(255,255,255,.35)` 底。
- 文字颜色 `#9c8572`。悬停时变白底、ink 色字、上浮 2px 并旋转 -1°，同时整面背景暂停。
- 中间加遮罩：`radial-gradient(ellipse 44% 58% at 50% 52%, peach 0%, rgba(255,217,184,.94) 50%, transparent 100%)`；手机端改为 `ellipse 70% 45% at 50% 42%`。
- 点击分类调用 `onSearch({ category })`，点击关键词调用 `onSearch({ keyword })`，然后平滑滚动到列表。
- `@media (prefers-reduced-motion: reduce)` 下 `animation: none`。

- [ ] **Step 2：`SearchBar`**

- 外框：白底，2px ink 描边，圆角 22px，没有阴影。网格 `1.5fr 1fr 1fr 1fr auto`，各段之间用 1px line 竖线分隔。
- 四段依次是关键词输入框、职位方向、地域、工作性质。
  - 每段左边一个 20px 图标（lucide 的 Search / Briefcase / Globe / Clock），右边是 12px/600 的小标签，下面一行 14px/400 的值。占位文字用 muted，已选值用 ink。
  - 三个下拉可以继续用 Radix Select，样式改成新主题。
- 右侧按钮"搜索 →"：orange 底，2px ink 描边，圆角 14px，高 46px，14px/600。
- 按回车或点按钮时，调用 `onSearch`，传入四个字段。
- 手机端（<860px）改成单列，各段之间用横线分隔，按钮占满整行。

- [ ] **Step 3：`Hero` 布局**

- 最外层 `<section data-hero>`（验收脚本靠这个属性定位）。
- 背景：`linear-gradient(180deg, peach 0%, peach-2 70%, cream 100%)`，`overflow: hidden`。
- 内容居中，上下内边距 44px 和 40px（手机端各 28px），左右沿用页面边距 24px。
- 大标题 `clamp(30px, 3.75vw, 48px)`，字重 700，行高 1。
- 副标题 16px/300，行高 24px，上边距 14px。
- 搜索栏上边距 26px，最大宽度 900px。
- 搜索栏下方一行，上边距 18px：
  - 左边是"每小时更新"徽章：白色 .75 透明底，绿点 `#16a34a`，12px/500。
  - 右边是"共 **{total}** 个在招职位"，14px/300 muted，数字字重 500。

- [ ] **Step 4：在浏览器里核对**

Run: `pnpm --filter @remote/web build && pnpm --filter @remote/web dev`

窗口 1280×900：在控制台执行 `document.querySelector('[data-hero]').getBoundingClientRect().height`。Expected: 在 300 到 330 之间。标题、副标题、搜索栏都清晰可读，背景在漂移，鼠标悬停时暂停；点击"🤖 AI/机器学习"后列表按 AI 筛选，网址变成 `?category=ai`。

窗口 375×812：在控制台执行 `document.documentElement.scrollWidth`。Expected: `375`。搜索栏竖排，左右各留出 24px 边距。

在 DevTools 的 Rendering 面板里开启 `prefers-reduced-motion: reduce`。Expected: 背景不再移动。

- [ ] **Step 5：提交**

```bash
git add apps/web/src/components/home
git commit -m "feat(web): hero with drifting category/keyword wall and segmented search"
```

---

### Task 9：整体验收

- [ ] **Step 1：全量测试和构建**

Run: `pnpm --filter @remote/backend test && pnpm --filter @remote/web test && pnpm build`
Expected: 测试全部通过，turbo 构建成功。

- [ ] **Step 2：Docker 环境冒烟测试**

Run: `docker compose up -d --build && sleep 20 && curl -s localhost/api/jobs/stats | head -c 200 && curl -s localhost/ | grep -c '为中国开发者找远程工作'`
Expected: 统计接口返回 JSON，首页 HTML 里能找到标题，计数 ≥ 1。

- [ ] **Step 3：和视觉稿逐项对照**

把视觉稿 `docs/superpowers/specs/2026-10-28-homepage-redesign-mockup.html` 和本地首页并排打开，在 1280 和 375 两个宽度下对照。有三处是规格里明确改过的，以规格为准：
- 筛选栏没有"快速筛选"那一组。
- 卡片标题后面没有箭头。
- 地域和工作性质的选项按规格里的取值。

发现的差异记下来，修掉后再提交。
