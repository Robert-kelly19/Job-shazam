import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,OneToMany,} from "typeorm";
import { SavedJob } from "../saved-job/saved-job.entity";
import { IsDate, IsEmail,IsNotEmpty,IsString,MaxLength,} from "class-validator";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({length:25})
    @IsNotEmpty()
    @IsString()
    @MaxLength(25)
    firstname: string;
    @Column({length:25})
     @IsNotEmpty()
    @IsString()
    @MaxLength(25)
    lastname: string;
    @Column({unique:true})
    @IsEmail()
    @IsNotEmpty()
    email: string;
    @Column({select:false,length:225})
    @IsNotEmpty()
    password: string;
    @CreateDateColumn({name: 'created_at'})
    @IsDate()
    createdAt: Date;
    @OneToMany(() => SavedJob, savedJob => savedJob.user)
  savedJobs: SavedJob[];
}