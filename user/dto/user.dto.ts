import { IsEmail, IsNotEmpty, IsString} from "class-validator";


export class SendLoginDto{
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    email: string;
}

export class VerifyLinkDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}