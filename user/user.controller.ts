import { Controller,Get,Post,Put,Param,Body,Delete, ParseIntPipe} from "@nestjs/common";
import { CreateUserDto,UserLoginDto,UserUpdateDto,GetUserDto, DeleteUserDto} from "./dto/user.dto";
import { UserService } from "./user.service";

@Controller('user')
export class UserController {
     constructor(private readonly userService: UserService) {}
  @Post('create')
  create(@Body() createUserDto:CreateUserDto){
   return this.userService.createUser(createUserDto);
  }

  @Post('login')
  async login(@Body()loginUser:UserLoginDto){
    return this.userService.login(loginUser);
  }

  @Put('updateuser')
  async updateuser(@Param('id')id:number, @Body()updateUserDto:UserUpdateDto){
    return this.userService.updateUser(id,updateUserDto);
  }

  @Get('getAllUsers')
  async getAllUsers(): Promise<GetUserDto[]>{
    return this.userService.findAll();
  }

  @Get('getUserById:id')
  async getUserById(@Param('id',ParseIntPipe) id: number): Promise<GetUserDto>{
    return this.userService.findById(id);
  }

  @Delete('deleteuser')
  async deleteuser(@Body() deleteuser:DeleteUserDto){
    const result = await this.userService.deleteUser(deleteuser);
    return result
  }
}