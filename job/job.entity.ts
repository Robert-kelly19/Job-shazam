import { Column, CreateDateColumn, Entity,PrimaryGeneratedColumn,} from "typeorm";
import { IsNotEmpty,IsString,MaxLength,IsUrl, IsArray, IsOptional} from "class-validator";
import { Type} from "class-transformer";

@Entity('job')
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
    @Column({nullable: true})
    @IsOptional()
    @IsString()
    description?: string;
    @Column("text",{array : true})
    @IsNotEmpty()
    @IsString()
    location: string;
    @Column()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    salary: string;
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
}