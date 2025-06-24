import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,OneToMany,} from "typeorm";
import { SavedJob } from "../saved-job/saved-job.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({length:25})
    firstname: string;
    @Column({length:25})
    lastname: string;
    @Column({unique:true})
    email: string;
    @Column({select:false,length:15})
    password: string;
    @CreateDateColumn({name: 'created_at'})
    createdAt: Date
    @OneToMany(() => SavedJob, savedJob => savedJob.user)
  savedJobs: SavedJob[];
}