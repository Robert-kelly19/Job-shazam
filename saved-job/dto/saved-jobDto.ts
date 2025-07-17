import { IsEnum, IsString} from "class-validator";


export enum jobStatus {
    SAVED = 'saved',
    APPLIED = 'applied',
    REJECTED = 'rejected',
    RECRUITED = 'recruited',
    UNRESPONSIVE = 'unresponsive',
}

export class UpdateStatusDto {
    @IsEnum(jobStatus)
    status:jobStatus;
}

export class savedJobDto {
    @IsString()
    job: string;

    @IsEnum(jobStatus)
    status: jobStatus;
}