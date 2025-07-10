import { Transform } from "class-transformer";
import {IsArray, IsDateString, IsNotEmpty,IsString,IsUrl,MaxLength,IsOptional} from "class-validator";


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
  @IsString({ each : true})
  @IsArray()
  location: string[];

  @IsString()
  @IsNotEmpty()
  salary: string;
  
  @IsArray()
  @IsString({ each: true }) 
  tags?: string[];

  @IsNotEmpty()
  @IsDateString() 
  postedAt: string;

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
  id: number;
  title: string;
  company: string;
  description?: string;
  location: string[];
   salary: string;
  tags: string[];
  postedAt: Date;
  applyUrl: string;
  source: string;

  constructor(job: {
    id: number;
    title: string;
    company: string;
    description?: string;
    location: string[];
    salary: string;
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
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  @IsArray()
  @IsString({ each: true })
  location?: string[];

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