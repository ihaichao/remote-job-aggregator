import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
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

    const where: Prisma.JobWhereInput = { isActive: true };

    if (filters.category) where.category = filters.category;
    if (filters.regionLimit) where.regionLimit = filters.regionLimit;
    if (filters.workType) where.workType = filters.workType;
    if (filters.keyword && filters.keyword.trim()) {
      const keyword = filters.keyword.trim();
      where.title = { contains: keyword, mode: 'insensitive' };
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

    return {
      data,
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
}
