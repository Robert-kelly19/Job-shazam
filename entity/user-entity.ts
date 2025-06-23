import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,OneToMany,ManyToOne,} from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    firstname: string;
    @Column()
    lastname: string;
    @Column({unique:true})
    email: string;
    @Column()
    password: string;
    @CreateDateColumn({name: 'created_at'})
    createdAt: Date
    @OneToMany(() => SavedJob, savedJob => savedJob.user)
  savedJobs: SavedJob[];
}

@Entity()
export class Job {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    title: string;
    @Column()
    company: string;
    @Column()
    location: string;
    @CreateDateColumn()
    postedAt: Date
}

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
