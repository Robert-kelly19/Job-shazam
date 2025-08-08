import {Body, Controller, Get, HttpCode, InternalServerErrorException, Patch, UploadedFile, UseInterceptors,UseGuards, NotFoundException} from "@nestjs/common";
import { UserService } from "./user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudinaryStore } from "cloudinary.config";
import { AuthGuard } from "@nestjs/passport";


@Controller('user')
export class UserController {
     constructor(private readonly userService: UserService) {}

     @Get()
     async getUser(){
          return await this.userService.findUser();
     }

@Patch('uploadcv')
@UseGuards(AuthGuard('jwt'))
@HttpCode(200)
@UseInterceptors(FileInterceptor('file', { storage: CloudinaryStore }))
async uploadCv(
  @Body('email') email: string,
  @UploadedFile() file: Express.Multer.File,
) {
  try {
    const user = await this.userService.uploadCv(email, file);
    return { message: 'CV upload was successful', cv: user.cv };
  } catch (err) {
    if (err instanceof NotFoundException) {
      throw err; 
    }
    console.error(err); 
    throw new InternalServerErrorException('Upload failed');
  }
}

}