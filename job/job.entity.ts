import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import {Type} from "class-transformer";
import {User} from "../user/user.entity";
import {SavedJob} from "../saved-job/saved-job.entity";
import {JobDescriptionDto} from "../job/dto/job-description.dto";

@Entity("job")
export class Job {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({length: 200})
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @Column({length: 200})
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  company: string;

  @Column({nullable: true})
  @IsOptional()
  @IsString()
  description?: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  location: string;

  @Column({nullable: true})
  @IsOptional()
  @IsString()
  companyLogo?: string;

  @Column({nullable: true})
  @IsOptional()
  @IsString()
  @MaxLength(100)
  salary?: string;

  @Column("text", {array: true})
  @IsNotEmpty()
  @IsArray()
  @IsString({each: true})
  tags: string[];

  @CreateDateColumn()
  postedAt: Date;

  @Column({length: 500})
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  applyUrl: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  source: string;

  @Column("jsonb", {nullable: true})
  @IsOptional()
  @ValidateNested()
  @Type(() => JobDescriptionDto)
  detailed?: JobDescriptionDto;

  @ManyToOne(() => User, (user) => user.jobs, {onDelete: "CASCADE"})
  user: User;

  @OneToMany(() => SavedJob, (savedJob) => savedJob.job)
  savedByUsers: SavedJob[];
}
