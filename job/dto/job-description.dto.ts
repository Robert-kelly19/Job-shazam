import {IsArray, IsOptional, IsString, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

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
