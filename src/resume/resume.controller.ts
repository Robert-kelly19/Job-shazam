import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {FileInterceptor} from "@nestjs/platform-express";
import {ResumeService} from "./resume.service";
import {Resume} from "./resume.entity";
import {JwtAuthGuard} from "../auth/jwt.guard";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller("api/resumes")
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
  ): Promise<{id: string; content: string; filename: string}> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (!req.user?.userId) {
      throw new BadRequestException("User not authenticated");
    }

    const resume = await this.resumeService.uploadResume(req.user.userId, file);

    return {
      id: resume.id,
      content: resume.content,
      filename: resume.filename,
    };
  }

  @Get()
  async getUserResumes(@Request() req: AuthRequest): Promise<Resume[]> {
    if (!req.user?.userId) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.resumeService.getUserResumes(req.user.userId);
  }

  @Get(":resumeId")
  async getResume(
    @Param("resumeId") resumeId: string,
    @Request() req: AuthRequest,
  ): Promise<Resume> {
    if (!req.user?.userId) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.resumeService.getResume(resumeId, req.user.userId);
  }

  @Post("set-default/:resumeId")
  async setDefaultResume(
    @Param("resumeId") resumeId: string,
    @Request() req: AuthRequest,
  ): Promise<Resume> {
    if (!req.user?.userId) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.resumeService.setDefaultResume(resumeId, req.user.userId);
  }

  @Post("delete/:resumeId")
  async deleteResume(
    @Param("resumeId") resumeId: string,
    @Request() req: AuthRequest,
  ): Promise<{message: string}> {
    if (!req.user?.userId) {
      throw new BadRequestException("User not authenticated");
    }

    await this.resumeService.deleteResume(resumeId, req.user.userId);
    return {message: "Resume deleted successfully"};
  }
}
