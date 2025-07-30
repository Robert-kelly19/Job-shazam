import {Transform, Type} from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class RequirementsDto {
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  mustHave?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  niceToHave?: string[];
}

export class BenefitsDto {
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  health?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  financial?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  timeOff?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  learning?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  other?: string[];
}

// Define the nested JobDescription structure
export class JobDescriptionDto {
  @IsOptional()
  @IsString()
  aboutUs?: string;

  @IsOptional()
  @IsString()
  roleOverview?: string;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  responsibilities?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RequirementsDto)
  requirements?: RequirementsDto;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  whyJoinUs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  process?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BenefitsDto)
  benefits?: BenefitsDto;
}

// CREATE DTO
export class GetJobsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  company: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  companyLogo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  salary?: string;

  @IsArray()
  @IsString({each: true})
  tags: string[];

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  applyUrl: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  source: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobDescriptionDto)
  detailed?: JobDescriptionDto;
}

// DISPLAY DTO
export class DisplayJobsDto {
  @IsUUID()
  id: string;

  title: string;
  company: string;
  description?: string;
  location: string;
  companyLogo?: string;
  salary?: string;
  tags: string[];
  postedAt: Date;
  applyUrl: string;
  source: string;

  @ValidateNested()
  @Type(() => JobDescriptionDto)
  detailed?: JobDescriptionDto;

  constructor(job: {
    id: string;
    title: string;
    company: string;
    description?: string;
    location: string;
    companyLogo?: string;
    salary?: string;
    tags: string[];
    postedAt: Date;
    applyUrl: string;
    source: string;
    detailed?: JobDescriptionDto;
  }) {
    this.id = job.id;
    this.title = job.title;
    this.company = job.company;
    this.description = job.description;
    this.location = job.location;
    this.companyLogo = job.companyLogo;
    this.salary = job.salary;
    this.tags = job.tags;
    this.postedAt = job.postedAt;
    this.applyUrl = job.applyUrl;
    this.source = job.source;
    this.detailed = job.detailed;
  }
}

// FILTER DTO
export class FilterJobDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Transform(({value}) => String(value))
  salary?: string;

  @IsOptional()
  @Transform(({value}) => (Array.isArray(value) ? value : value.split(",")))
  @IsArray()
  @IsString({each: true})
  tags?: string[];
}

// MATCH DTO
export class matchDto {
  @IsString()
  description: string;

  @IsString()
  cv: string;
}

export class MatchResultDto {
  @IsString()
  jobId: string;

  @IsString()
  jobTitle: string;

  @IsString()
  jobCompany: string;

  @IsString()
  matchScore: string; // Percentage as a string

  @IsString()
  matchDetails: string; // JSON string of detailed match results
}
