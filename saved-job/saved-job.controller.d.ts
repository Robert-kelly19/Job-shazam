import { SavedJobService } from './saved-job.service';
import { UpdateStatusDto } from './dto/saved-jobDto';
import { Request as ExpressRequest } from 'express';
import { savedJobDto } from './dto/saved-jobDto';
interface AuthenticatedRequest extends ExpressRequest {
    user: {
        userId: string;
        email: string;
    };
}
export declare class SavedJobController {
    private readonly savedJob;
    constructor(savedJob: SavedJobService);
    create(dto: savedJobDto, req: AuthenticatedRequest): Promise<{
        message: string;
        data: import("./saved-job.entity").SavedJob;
    }>;
    getJobStatusForUser(jobId: string, req: AuthenticatedRequest): Promise<{
        status: string;
    }>;
    getAll(req: AuthenticatedRequest): Promise<{
        data: import("./saved-job.entity").SavedJob[];
    }>;
    update(jobId: string, body: UpdateStatusDto, req: AuthenticatedRequest): Promise<{
        message: string;
        data: import("./saved-job.entity").SavedJob;
    }>;
}
export {};
