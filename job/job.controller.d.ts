import { JobService } from './job.service';
import { GetJobsDto, DisplayJobsDto, FilterJobDto } from './dto/job.dto';
export declare class JobController {
    private readonly jobService;
    constructor(jobService: JobService);
    create(jobDto: GetJobsDto): Promise<DisplayJobsDto>;
    filterJobs(filterDto: FilterJobDto): Promise<import("./job.entity").Job[]>;
    findAll(): Promise<DisplayJobsDto[]>;
    findOne(id: string): Promise<DisplayJobsDto | null>;
}
