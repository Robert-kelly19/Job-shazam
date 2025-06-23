import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,} from "typeorm";
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