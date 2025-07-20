import { Transform } from "class-transformer";
import {IsArray,  IsNotEmpty,IsString,IsUrl,MaxLength,IsOptional, IsUUID} from "class-validator";



export class GetJobsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  company: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;


  @IsNotEmpty()
  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  salary?: string;
  
  @IsArray()
  @IsString({ each: true }) 
  tags?: string[];

  @IsNotEmpty()
  @IsUrl()
  @MaxLength(255) 
  applyUrl: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  source: string;
}


export class DisplayJobsDto {
  @IsUUID()
  id: string;
  title: string;
  company: string;
  description?: string;
  location: string;
  salary?: string;
  tags: string[];
  postedAt: Date;
  applyUrl: string;
  source: string;

  constructor(job: {
    id: string;
    title: string;
    company: string;
    description?: string;
    location: string;
    salary?: string;
    tags: string[];
    postedAt: Date;
    applyUrl: string;
    source: string;
  }) {
    this.id = job.id;
    this.title = job.title;
    this.company = job.company;
    this.description = job.description
    this.location = job.location;
    this.tags = job.tags;
    this.salary = job.salary
    this.postedAt = job.postedAt;
    this.applyUrl = job.applyUrl;
    this.source = job.source;
  }
}

export class FilterJobDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value))
  salary?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}