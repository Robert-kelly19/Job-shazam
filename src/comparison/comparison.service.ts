import {Injectable, BadRequestException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Comparison} from "./comparison.entity";

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

@Injectable()
export class ComparisonService {
  constructor(
    @InjectRepository(Comparison)
    private readonly comparisonRepo: Repository<Comparison>,
  ) {}

  async saveComparison(
    userId: string,
    jobId: string,
    resumeId: string,
    result: ComparisonResult,
  ): Promise<Comparison> {
    const comparison = this.comparisonRepo.create({
      userId,
      jobId,
      resumeId,
      result,
    });

    return await this.comparisonRepo.save(comparison);
  }

  async getUserComparisons(userId: string): Promise<Comparison[]> {
    return await this.comparisonRepo.find({
      where: {userId},
      relations: ["job", "resume"],
      order: {createdAt: "DESC"},
    });
  }

  async getJobComparisons(jobId: string, userId: string): Promise<Comparison[]> {
    return await this.comparisonRepo.find({
      where: {userId, jobId},
      relations: ["resume"],
      order: {createdAt: "DESC"},
    });
  }

  async getComparison(comparisonId: string, userId: string): Promise<Comparison> {
    const comparison = await this.comparisonRepo.findOne({
      where: {id: comparisonId, userId},
      relations: ["job", "resume"],
    });

    if (!comparison) {
      throw new BadRequestException("Comparison not found");
    }

    return comparison;
  }

  async markAsApplied(comparisonId: string, userId: string): Promise<Comparison> {
    const comparison = await this.getComparison(comparisonId, userId);
    comparison.appliedDate = new Date();
    return await this.comparisonRepo.save(comparison);
  }

  async addNotes(comparisonId: string, userId: string, notes: string): Promise<Comparison> {
    const comparison = await this.getComparison(comparisonId, userId);
    comparison.notes = notes;
    return await this.comparisonRepo.save(comparison);
  }

  async deleteComparison(comparisonId: string, userId: string): Promise<void> {
    const comparison = await this.getComparison(comparisonId, userId);
    await this.comparisonRepo.remove(comparison);
  }

  async getConversionStats(userId: string): Promise<{
    totalComparisons: number;
    applied: number;
    appliedRate: number;
  }> {
    const comparisons = await this.getUserComparisons(userId);
    const applied = comparisons.filter((c) => c.appliedDate).length;

    return {
      totalComparisons: comparisons.length,
      applied,
      appliedRate: comparisons.length > 0 ? (applied / comparisons.length) * 100 : 0,
    };
  }
}
