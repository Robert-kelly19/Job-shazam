import {IsEnum, IsString} from "class-validator";

export enum jobStatus {
  SAVED = "saved",
  APPLIED = "applied",
  ACCEPTED = "accepted",
  Interview = "interview",
  REJECTED = "rejected",
}

export class UpdateStatusDto {
  @IsEnum(jobStatus)
  status: jobStatus;
}

export class savedJobDto {
  @IsString()
  jobId: string;

  @IsEnum(jobStatus)
  status: jobStatus;
}
