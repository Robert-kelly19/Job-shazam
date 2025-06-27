import {IsArray, IsDateString, IsNotEmpty,IsString,IsUrl,MaxLength,} from "class-validator";


export class GetJobsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  company: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  location: string;

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
  location: string;
  tags: string[];
  postedAt: Date;
  applyUrl: string;
  source: string;

  constructor(job: {
    id: number;
    title: string;
    company: string;
    location: string;
    tags: string[];
    postedAt: Date;
    applyUrl: string;
    source: string;
  }) {
    this.id = job.id;
    this.title = job.title;
    this.company = job.company;
    this.location = job.location;
    this.tags = job.tags;
    this.postedAt = job.postedAt;
    this.applyUrl = job.applyUrl;
    this.source = job.source;
  }
}