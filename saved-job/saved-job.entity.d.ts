import { User } from "../user/user.entity";
import { Job } from "../job/job.entity";
export declare class SavedJob {
    id: string;
    user: User;
    job: Job;
    status: 'saved' | 'applied' | 'rejected' | 'recruited' | 'unresponsive';
    savedAt: Date;
}
