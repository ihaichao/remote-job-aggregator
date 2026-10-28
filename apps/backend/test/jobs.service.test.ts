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
