import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('regionLimit') regionLimit?: string,
    @Query('workType') workType?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobsService.findAll({
      category,
      regionLimit,
      workType,
      keyword,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // Must stay above ':id' so "stats" is not parsed as a job id
  @Get('stats')
  async stats() {
    return this.jobsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const job = Number.isInteger(+id) ? await this.jobsService.findOne(+id) : null;
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }
}
