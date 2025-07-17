import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedJob } from './saved-job.entity';
import { jobStatus, savedJobDto } from './dto/saved-jobDto';

@Injectable()
export class SavedJobService {
  constructor(
    @InjectRepository(SavedJob)
    private readonly savedJobRepo: Repository<SavedJob>,
  ) {}

 async CreateSavedJob(dto: savedJobDto & { user: string }): Promise<SavedJob> {
  const newSavedJob = this.savedJobRepo.create({
    user: { id: dto.user }, // nested relation
    job: { id: dto.job },
    status: dto.status,
  });

  return await this.savedJobRepo.save(newSavedJob);
}

async GetSavedJobs(userId: string): Promise<SavedJob[]> {
  return await this.savedJobRepo.find({
    where: { user: { id: userId } },
    relations: ['user', 'job'],
  });
}

 
  async findByUserAndJob(userId: string, jobId: string): Promise<SavedJob | null> {
    return await this.savedJobRepo.findOne({
      where: { user: { id: userId }, job: { id: jobId } },
      relations: ['user', 'job'],
    });
  }

  
  async UpdateStatus(userId: string, jobId: string, status: jobStatus): Promise<SavedJob> {
    const savedJob = await this.savedJobRepo.findOne({
      where: { user: { id: userId }, job: { id: jobId } },
      relations: ['user', 'job'],
    });

    if (!savedJob) {
      throw new NotFoundException('Saved job not found for this user and job');
    }

    savedJob.status = status;
    return await this.savedJobRepo.save(savedJob);
  }
}
