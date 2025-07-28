import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString} from "class-validator";


export class SendLoginDto{
    @IsString()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsString({each: true})
    @IsOptional()
    techstack?: string[];

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;
}

export class VerifyLinkDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}

export class getUserDto {
    name: string;

    techstack: string[];

    email: string;

    token: string;

    used: boolean;
}




