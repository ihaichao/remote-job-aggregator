import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobStats } from './job-stats';

const LIST_DESCRIPTION_PREVIEW = 500;
const STATS_TTL_MS = 5 * 60 * 1000;
const STATS_REGIONS = ['worldwide', 'CN'];
const STATS_WORK_TYPES = ['fulltime', 'parttime'];

@Injectable()
export class JobsService {
  private statsCache: { value: JobStats; expiresAt: number } | null = null;

  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    category?: string;
    regionLimit?: string;
    workType?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (filters.category) where.category = { has: filters.category };
    if (filters.regionLimit) where.regionLimit = filters.regionLimit;
    if (filters.workType) where.workType = filters.workType;
    const keyword = filters.keyword?.trim();
    if (keyword) {
      // Match the title, or a tag equal to the keyword ignoring case
      const tagMatches = await this.prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
        SELECT id FROM jobs
        WHERE is_active AND EXISTS (SELECT 1 FROM unnest(tags) t WHERE lower(t) = lower(${keyword}))
      `);
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { id: { in: tagMatches.map((row) => row.id) } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { datePosted: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    // Full descriptions can be long; list views only need a preview
    const previews = data.map((job) => ({
      ...job,
      description: job.description ? job.description.slice(0, LIST_DESCRIPTION_PREVIEW) : job.description,
    }));

    return {
      data: previews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.job.findUnique({ where: { id } });
  }

  async getStats(): Promise<JobStats> {
    if (this.statsCache && this.statsCache.expiresAt > Date.now()) return this.statsCache.value;

    const where = { isActive: true };
    const [total, categoryRows, regionRows, workTypeRows, latest] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.$queryRaw<{ category: string; count: bigint }[]>(Prisma.sql`
        SELECT c AS category, count(*) AS count FROM jobs, unnest(category) c
        WHERE is_active GROUP BY c
      `),
      this.prisma.job.groupBy({ by: ['regionLimit'], where, _count: { _all: true } }),
      this.prisma.job.groupBy({ by: ['workType'], where, _count: { _all: true } }),
      this.prisma.job.aggregate({ where, _max: { updatedAt: true } }),
    ]);

    const categories: Record<string, number> = {};
    for (const row of categoryRows) {
      if (row.category !== 'other') categories[row.category] = Number(row.count);
    }
    const pick = (rows: any[], key: string, allowed: string[]) =>
      Object.fromEntries(rows.filter((r) => allowed.includes(r[key])).map((r) => [r[key], r._count._all]));

    const value: JobStats = {
      total,
      categories,
      regions: pick(regionRows, 'regionLimit', STATS_REGIONS),
      workTypes: pick(workTypeRows, 'workType', STATS_WORK_TYPES),
      lastSyncedAt: latest._max.updatedAt ? latest._max.updatedAt.toISOString() : null,
    };
    this.statsCache = { value, expiresAt: Date.now() + STATS_TTL_MS };
    return value;
  }
}
