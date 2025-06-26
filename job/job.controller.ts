import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { JobService } from './job.service';
import { GetJobsDto,DisplayJobsDto } from './dto/job.dto';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async create(@Body() jobDto: GetJobsDto): Promise<DisplayJobsDto> {
    return this.jobService.create(jobDto);
  }

  @Get()
  async findAll(): Promise<DisplayJobsDto[]> {
    return this.jobService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DisplayJobsDto | null> {
    return this.jobService.findOne(id);
  }
}
