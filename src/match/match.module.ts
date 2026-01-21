import {Module} from "@nestjs/common";
import {MatchService} from "./match.service";
import {MatchController} from "./match.controller";
import {CacheModule} from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600000, // 1 hour in milliseconds
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [MatchController],
  providers: [MatchService],
})
export class MatchModule {}
