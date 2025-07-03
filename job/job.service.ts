// src/jobs/job.service.ts
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
    if(jobDto.description === null){
      jobDto.description = ""
    }

    const exists = await this.jobRepo.findOne({
      where: { applyUrl: jobDto.applyUrl },
    });

    if (exists) {
      return new DisplayJobsDto(exists);
    }

    const job = this.jobRepo.create(jobDto);
    const saved = await this.jobRepo.save(job);
    return new DisplayJobsDto(saved);
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
    query.andWhere('job.location && :location', { location });
  }

  if (salary) {
    query.andWhere('job.salary ILIKE :salary', { salary: `%${salary}%` });
  }

  if (tags?.length) {
    query.andWhere('job.tags && :tags', { tags });
  }

  return query.getMany();
}


}
