import {Controller, HttpCode, Post, Body, UseGuards} from "@nestjs/common";
import {MatchService} from "./match.service";
import {matchDto} from "../job/dto/job.dto";
import {Throttle, ThrottlerGuard} from "@nestjs/throttler";

@Controller("match")
@UseGuards(ThrottlerGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @HttpCode(200)
  @Throttle({default: {limit: 5, ttl: 60000}}) // 5 requests per minute for CV comparison
  matchcv(@Body() dto: matchDto) {
    return this.matchService.getMatch(dto);
  }

  @Post("generate-cv")
  @HttpCode(200)
  @Throttle({default: {limit: 3, ttl: 60000}}) // 3 requests per minute for CV generation
  generateCV(@Body() dto: matchDto) {
    return this.matchService.generateTailoredCV(dto);
  }
}
