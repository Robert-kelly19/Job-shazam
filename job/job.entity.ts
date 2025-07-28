import { Column, CreateDateColumn, Entity,ManyToOne,OneToMany,PrimaryGeneratedColumn,} from "typeorm";
import { IsNotEmpty,IsString,MaxLength,IsUrl, IsArray, IsOptional} from "class-validator";
import { Type} from "class-transformer";
import { User } from "../user/user.entity";
import { SavedJob } from "../saved-job/saved-job.entity";

@Entity('job')
export class Job {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({length:200})
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    title: string;

    @Column({length:200})
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    company: string;

    // @Column('text',{nullable: true, array: true})
    @Column({nullable:true})
    @IsString()
    @IsOptional()
    // @IsArray()
    // @Type(()=>String)
    description?: string;

    @Column()
    @IsNotEmpty()
    @IsString()
    location: string;

    @Column({nullable:true})
    @IsOptional()
    @IsString()
    companyLogo?: string;

    @Column({nullable: true})
    @IsString()
    @IsOptional()
    @MaxLength(100)
    salary?: string;

    @Column("text", { array: true })
    @IsNotEmpty()
    @IsArray()
    @Type(() => String)
    tags: string[];

    @CreateDateColumn()
    postedAt: Date;

    @Column({ length: 500 })
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

  @ManyToOne(() => User, user => user.jobs, { onDelete: 'CASCADE' })
  user: User;
  
  @OneToMany(() => SavedJob, savedJob => savedJob.job)
  savedByUsers: SavedJob[];

}