import { SavedJob } from '../saved-job/saved-job.entity';
import { Job } from 'job/job.entity';
export declare class User {
    id: string;
    name?: string;
    techstack?: string[];
    email: string;
    token: string;
    used: boolean;
    createdAt: Date;
    savedJobs: SavedJob[];
    jobs: Job[];
}
