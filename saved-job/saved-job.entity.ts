import {CreateDateColumn, Entity,PrimaryGeneratedColumn,ManyToOne,} from "typeorm";
import { User } from "user/user.entity";
import { Job } from "job/job.entity";
@Entity()
export class SavedJob{
    @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.savedJobs, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  job: Job;

  @CreateDateColumn()
  savedAt: Date;
}