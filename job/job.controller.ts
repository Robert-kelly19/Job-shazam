import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { JobService } from './job.service';
import { GetJobsDto, DisplayJobsDto, FilterJobDto } from './dto/job.dto';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async create(@Body() jobDto: GetJobsDto): Promise<DisplayJobsDto> {
    return this.jobService.create(jobDto);
  }

  @Get('filter')
  async filterJobs(@Query() filterDto: FilterJobDto) {
  console.log('Filter DTO:', filterDto);
  return this.jobService.getFilterJobs(filterDto);
  }


  @Get()
  async findAll(): Promise<DisplayJobsDto[]> {
    return this.jobService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DisplayJobsDto | null> {
    return this.jobService.findOne(id);
  }
}
