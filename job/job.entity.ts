import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,} from "typeorm";;
export enum Type {
    REMOTE = 'remote',
    ONSITE = 'onsite',
    HYBRID = 'hybrid'
}
@Entity()
export class Job {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    title: string;
    @Column()
    company: string;
    @Column({
        type: "enum",
        enum: Type,
        default: Type.REMOTE
    })
    worklocation: Type;
    @Column()
    location: string;
    @Column()
    discription: string;
    @Column()
    position: string;
    @Column()
    joblink: string;
    @CreateDateColumn()
    postedAt: Date;
}