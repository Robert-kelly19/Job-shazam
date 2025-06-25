import {IsEmail,IsNotEmpty,IsString,MaxLength,} from "class-validator";


export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(25)
    firstname: string;
    @IsString()
    @IsNotEmpty()
    @MaxLength(25)
    lastname: string;
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;
    @IsString()
    @IsNotEmpty()
    @MaxLength(225)
    password: string;
}

export class UserUpdateDto {
    @IsString()
    @MaxLength(25)
    firstname?: string;
    @IsString()
    @MaxLength(25)
    lastname?: string;
    @IsEmail()
    email?: string;
    @IsString()
    @MaxLength(225)
    password?: string;
}

export class UserLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
    @IsString()
    @IsNotEmpty()
    @MaxLength(225)
    password: string;
}

export class GetUserDto {
    id:number;
    firstname:string;
    lastname: string;
    email:string;
    constructor(user: { id: number; firstname: string; lastname: string; email: string; }){
        this.id = user.id;
        this.firstname=user.firstname;
        this.lastname = user.lastname;
        this.email = user.email;
    }
}

export class DeleteUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
    @IsString()
    @IsNotEmpty()
    @MaxLength(225)
    password: string;
}