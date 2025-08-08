import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
  Get,
  Post,
  Request,
  ConflictException,
} from '@nestjs/common';
import { SavedJobService } from './saved-job.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateStatusDto } from './dto/saved-jobDto';
import { Request as ExpressRequest } from 'express';
import { savedJobDto } from './dto/saved-jobDto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
  };
}
@Controller('saved-jobs')
@UseGuards(AuthGuard('jwt'))
export class SavedJobController {
  constructor(private readonly savedJob: SavedJobService) {}

 @Post()
async create(
  @Body() dto: savedJobDto,
  @Request() req: AuthenticatedRequest,
) {
  const userId = req.user.userId;
const existing = await this.savedJob.findByUserAndJob(userId, dto.jobId);
if (existing) {
  throw new ConflictException('Job already saved by this user');
}

  const created = await this.savedJob.CreateSavedJob({
    ...dto,
    user: userId,
  });

  return { message: 'Saved job created', data: created };
}


  @Get(':jobId/status')
  async getJobStatusForUser(
    @Param('jobId') jobId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const savedJob = await this.savedJob.findByUserAndJob(userId, jobId);
    if (!savedJob) {
      return { status: 'not_saved' };
    }
    return { status: savedJob.status };
  }

  @Get()
  async getAll(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const jobs = await this.savedJob.GetSavedJobs(userId);
    return { data: jobs };
  }



  @Patch(':jobId')
  async update(
    @Param('jobId') jobId: string,
    @Body() body: UpdateStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const updated = await this.savedJob.UpdateStatus(userId, jobId, body.status);
    return { message: 'Status updated', data: updated };
  }
}
