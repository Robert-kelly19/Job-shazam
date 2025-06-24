import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,} from "typeorm";;
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
    @Column()
    discription: string;
    @CreateDateColumn()
    postedAt: Date;
}