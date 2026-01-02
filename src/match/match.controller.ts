import {Controller, HttpCode, Post, Body} from "@nestjs/common";
import {MatchService} from "./match.service";
import {matchDto} from "../job/dto/job.dto";

@Controller("match")
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @HttpCode(200)
  matchcv(@Body() dto: matchDto) {
    return this.matchService.getMatch(dto);
  }
}
