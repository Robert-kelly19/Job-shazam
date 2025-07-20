import {IsEmail, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class SendMailDto {
  @IsEmail()
  @IsOptional()
  from: string;

  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text: string;
}

export class GetMailDto {
  @IsEmail()
  @IsNotEmpty()
  from: string;

  @IsEmail()
  @IsOptional()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsNotEmpty()
  @IsString()
  text: string;
}

export class SendLogInMail {
  @IsEmail()
  @IsOptional()
  to: string;

  @IsString()
  @IsNotEmpty()
  link: string;
}
