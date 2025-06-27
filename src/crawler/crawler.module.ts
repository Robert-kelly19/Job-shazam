import {Module} from "@nestjs/common";
import {CrawlerService} from "./crawler.service";
import {JobModule} from "job/job.module";

@Module({
  imports: [JobModule],
  providers: [CrawlerService],
})
export class CrawlerModule {}
