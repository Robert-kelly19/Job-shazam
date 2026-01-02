import {CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, Column} from "typeorm";
import {User} from "../user/user.entity";
import {Job} from "../job/job.entity";
@Entity("savedjobs")
export class SavedJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.savedJobs, {onDelete: "CASCADE"})
  user: User;

  @ManyToOne(() => Job, (job) => job.savedByUsers, {onDelete: "CASCADE"})
  job: Job;

  @Column({default: "saved"})
  status: "saved" | "applied" | "rejected" | "interview" | "accepted";

  @CreateDateColumn()
  savedAt: Date;
}
