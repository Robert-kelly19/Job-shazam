import {
  Controller,
  Get,
  Delete,
  Patch,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import {AuthGuard} from "@nestjs/passport";
import {UserService} from "./user.service";
import {Request, Response} from "express";
import {join} from "path";
import {existsSync, unlinkSync} from "fs";

@Controller("user")
@UseGuards(AuthGuard("jwt"))
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Upload CV - POST /user/upload-cv
  @Patch("upload-cv")
  @UseInterceptors(
    FileInterceptor("file", {
      dest: "./uploads/cvs",
      limits: {fileSize: 9 * 1024 * 1024},
    }),
  )
  @HttpCode(200)
  async uploadCv(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new InternalServerErrorException("No file uploaded");
    }
    const email = (req.user as {email: string}).email;
    try {
      const user = await this.userService.uploadCv(email, file);
      return {message: "CV upload was successful", cv: user.cv};
    } catch {
      throw new InternalServerErrorException("Upload failed");
    }
  }

  // Get CV - GET /user/cv
  @Get("cv")
  async getCv(@Req() req: Request, @Res() res: Response) {
    const email = (req.user as {email: string}).email;
    const user = await this.userService.findByEmail(email);
    if (!user || !user.cv) {
      throw new NotFoundException("No CV found for this user");
    }

    const filePath = join(process.cwd(), user.cv);
    if (!existsSync(filePath)) {
      throw new NotFoundException("CV file not found on server");
    }
    return res.sendFile(filePath);
  }

  // Delete CV - DELETE /user/cv
  @Delete("cv")
  @HttpCode(200)
  async deleteCv(@Req() req: Request) {
    const email = (req.user as {email: string}).email;

    const user = await this.userService.findByEmail(email);
    if (!user || !user.cv) {
      throw new NotFoundException("No CV to delete");
    }
    const filePath = join(process.cwd(), user.cv);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    return {message: "CV deleted successfully"};
  }
}
