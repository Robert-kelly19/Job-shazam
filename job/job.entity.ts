import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,} from "typeorm";
import { IsNotEmpty,IsString,MaxLength} from "class-validator";
export enum Type {
    REMOTE = 'remote',
    ONSITE = 'onsite',
    HYBRID = 'hybrid'
}
@Entity()
export class Job {
    @PrimaryGeneratedColumn()
    id: number;
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
    @Column({
        type: "enum",
        enum: Type,
        default: Type.REMOTE
    })
    worklocation: Type;
    @Column({length:200})
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    location: string;
    @Column({length:2000})
    @IsNotEmpty()
    @IsString()
    @MaxLength(2000)
    description: string;
    @Column()
    position: string;
    @Column()
    joblink: string;
    @CreateDateColumn()
    postedAt: Date;
}