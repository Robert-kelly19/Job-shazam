import { Repository } from 'typeorm';
import { SavedJob } from './saved-job.entity';
import { jobStatus, savedJobDto } from './dto/saved-jobDto';
export declare class SavedJobService {
    private readonly savedJobRepo;
    constructor(savedJobRepo: Repository<SavedJob>);
    CreateSavedJob(dto: savedJobDto & {
        user: string;
    }): Promise<SavedJob>;
    GetSavedJobs(userId: string): Promise<SavedJob[]>;
    findByUserAndJob(userId: string, jobId: string): Promise<SavedJob | null>;
    UpdateStatus(userId: string, jobId: string, status: jobStatus): Promise<SavedJob>;
}
