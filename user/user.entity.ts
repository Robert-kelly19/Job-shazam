import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';

import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { SavedJob } from '../saved-job/saved-job.entity';
import { Job } from '../job/job.entity';
import { Type } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: true})
  @IsString()
  @IsOptional()
  name?: string;

  @Column('text', {array:true,nullable: true})
  @IsArray()
  @IsOptional()
  @Type(() => String )
  techstack?:string[];

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @IsUUID()
  @IsNotEmpty()
  @IsString()
  token: string;

  @Column({ default: false })
  @IsBoolean()
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => SavedJob, (savedJob) => savedJob.user)
  savedJobs: SavedJob[];

  @OneToMany(() => Job, job => job.user)
  jobs: Job[];

}
