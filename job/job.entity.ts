import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,} from "typeorm";
import { IsNotEmpty,IsString,MaxLength,IsUrl, IsArray} from "class-validator";

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
    @Column({length:200})
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    location: string;
     @Column("text", { array: true })
     @IsNotEmpty()
     @IsArray()
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
    source: string
}