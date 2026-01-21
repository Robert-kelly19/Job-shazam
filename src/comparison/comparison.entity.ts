import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {IsJSON, IsNotEmpty, IsOptional, IsString, IsUUID} from "class-validator";
import {User} from "../user/user.entity";
import {Job} from "../job/job.entity";
import {Resume} from "../resume/resume.entity";

@Entity("comparison")
export class Comparison {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ManyToOne(() => User, {onDelete: "CASCADE"})
  user: User;

  @Column()
  @IsNotEmpty()
  @IsUUID()
  jobId: string;

  @ManyToOne(() => Job, {onDelete: "CASCADE"})
  job: Job;

  @Column()
  @IsNotEmpty()
  @IsUUID()
  resumeId: string;

  @ManyToOne(() => Resume, {onDelete: "CASCADE"})
  resume: Resume;

  @Column("jsonb")
  @IsJSON()
  result: {
    matchPercentage: number;
    breakdown: {
      technical: number;
      experience: number;
      education: number;
      softSkills: number;
    };
    strengths: string[];
    missingSkills: string[];
    suggestions: string[];
    keywords?: {
      matched: string[];
      missing: string[];
    };
  };

  @Column({nullable: true})
  @IsOptional()
  @IsString()
  notes?: string; // User notes or feedback on comparison

  @CreateDateColumn({name: "created_at"})
  createdAt: Date;

  @Column({default: null, nullable: true})
  @IsOptional()
  appliedDate?: Date; // Track when user actually applied after comparison
}
