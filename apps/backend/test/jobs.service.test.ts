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
