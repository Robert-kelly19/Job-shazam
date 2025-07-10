import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { GetJobsDto, DisplayJobsDto, FilterJobDto } from './dto/job.dto';



@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async create(jobDto: GetJobsDto): Promise<DisplayJobsDto> {
 
  
    if (!jobDto.description) {
      jobDto.description = '';
    }

    const existingJob = await this.jobRepo.findOne({
      where: { applyUrl: jobDto.applyUrl },
    });

    if (existingJob) {
      return new DisplayJobsDto(existingJob);
    }

  
    const job = this.jobRepo.create(jobDto);
    const savedJob = await this.jobRepo.save(job);
    return new DisplayJobsDto(savedJob);
  }

  async findAll(): Promise<DisplayJobsDto[]> {
    const jobs = await this.jobRepo.find({
      order: { postedAt: 'DESC' },
    });

    return jobs.map((job) => new DisplayJobsDto(job));
  }

  async findOne(id: number): Promise<DisplayJobsDto | null> {
    const job = await this.jobRepo.findOne({ where: { id } });
    return job ? new DisplayJobsDto(job) : null;
  }

async getFilterJobs(filterDto: FilterJobDto): Promise<Job[]> {
  const { location, salary, tags } = filterDto;

  const query = this.jobRepo.createQueryBuilder('job');

  if (location?.length) {
    query.andWhere('job.location && ARRAY[:...location]', { location });
  }

  if (salary) {
    query.andWhere('job.salary ILIKE :salary', { salary: `%${salary}%` });
  }

  if (tags?.length) {
    query.andWhere('job.tags && ARRAY[:...tags]', { tags });
  }

  return query.getMany();
}

  
}
