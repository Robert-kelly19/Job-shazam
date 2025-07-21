import { User } from "user/user.entity";
import { SavedJob } from "saved-job/saved-job.entity";
export declare class Job {
    id: string;
    title: string;
    company: string;
    description?: string;
    location: string;
    salary?: string;
    tags: string[];
    postedAt: Date;
    applyUrl: string;
    source: string;
    user: User;
    savedByUsers: SavedJob[];
}
