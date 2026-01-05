import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { category?: string; regionLimit?: string; workType?: string }) {
    const where: any = { isActive: true };

    if (filters.category) where.category = filters.category;
    if (filters.regionLimit) where.regionLimit = filters.regionLimit;
    if (filters.workType) where.workType = filters.workType;

    return this.prisma.job.findMany({
      where,
      orderBy: { datePosted: 'desc' },
      take: 50,
    });
  }

  async findOne(id: number) {
    return this.prisma.job.findUnique({ where: { id } });
  }
}
