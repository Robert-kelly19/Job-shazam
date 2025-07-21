import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { GetJobsDto, DisplayJobsDto, FilterJobDto } from './dto/job.dto';
export declare class JobService {
    private readonly jobRepo;
    constructor(jobRepo: Repository<Job>);
    create(jobDto: GetJobsDto): Promise<DisplayJobsDto>;
    findAll(): Promise<DisplayJobsDto[]>;
    findOne(id: string): Promise<DisplayJobsDto | null>;
    getFilterJobs(filterDto: FilterJobDto): Promise<Job[]>;
}
