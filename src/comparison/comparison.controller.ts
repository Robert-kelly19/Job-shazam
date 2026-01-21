import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import {ComparisonService} from "./comparison.service";
import {Comparison} from "./comparison.entity";
import {JwtAuthGuard} from "../auth/jwt.guard";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

interface ComparisonResult {
  matchPercentage: number;
  breakdown: {
    technical: number;
    experience: number;
    education: number;
    softSkills: number;
  };
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
  keywords?: {
    matched: string[];
    missing: string[];
  };
}

@Controller("api/comparisons")
@UseGuards(JwtAuthGuard)
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Post()
  async saveComparison(
    @Body()
    dto: {
      jobId: string;
      resumeId: string;
      result: ComparisonResult;
    },
    @Request() req: AuthRequest,
  ): Promise<Comparison> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.saveComparison(
      req.user.id,
      dto.jobId,
      dto.resumeId,
      dto.result,
    );
  }

  @Get()
  async getUserComparisons(@Request() req: AuthRequest): Promise<Comparison[]> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.getUserComparisons(req.user.id);
  }

  @Get("job/:jobId")
  async getJobComparisons(
    @Param("jobId") jobId: string,
    @Request() req: AuthRequest,
  ): Promise<Comparison[]> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.getJobComparisons(jobId, req.user.id);
  }

  @Get(":comparisonId")
  async getComparison(
    @Param("comparisonId") comparisonId: string,
    @Request() req: AuthRequest,
  ): Promise<Comparison> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.getComparison(comparisonId, req.user.id);
  }

  @Post(":comparisonId/mark-applied")
  async markAsApplied(
    @Param("comparisonId") comparisonId: string,
    @Request() req: AuthRequest,
  ): Promise<Comparison> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.markAsApplied(comparisonId, req.user.id);
  }

  @Post(":comparisonId/notes")
  async addNotes(
    @Body() dto: {notes: string},
    @Param("comparisonId") comparisonId: string,
    @Request() req: AuthRequest,
  ): Promise<Comparison> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.addNotes(comparisonId, req.user.id, dto.notes);
  }

  @Post(":comparisonId/delete")
  async deleteComparison(
    @Param("comparisonId") comparisonId: string,
    @Request() req: AuthRequest,
  ): Promise<{message: string}> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    await this.comparisonService.deleteComparison(comparisonId, req.user.id);
    return {message: "Comparison deleted successfully"};
  }

  @Get("stats/conversion")
  async getConversionStats(@Request() req: AuthRequest): Promise<Record<string, unknown>> {
    if (!req.user?.id) {
      throw new BadRequestException("User not authenticated");
    }

    return await this.comparisonService.getConversionStats(req.user.id);
  }
}
