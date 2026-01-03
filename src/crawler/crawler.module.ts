import {Module} from "@nestjs/common";
import {CrawlerService} from "./crawler.service";
import {JobModule} from "../job/job.module";
import {RemoteOkStrategy} from "./strategies/remoteok.strategy";
import {WeWorkRemotelyStrategy} from "./strategies/weworkremotely.strategy";
import {RemoteCoStrategy} from "./strategies/remoteco.strategy";
import {RemotiveStrategy} from "./strategies/remotive.strategy";

@Module({
  imports: [JobModule],
  providers: [
    CrawlerService,
    RemoteOkStrategy,
    WeWorkRemotelyStrategy,
    RemoteCoStrategy,
    RemotiveStrategy,
  ],
})
export class CrawlerModule {}
