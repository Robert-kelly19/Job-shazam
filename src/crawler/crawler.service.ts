import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {JobService} from "../job/job.service";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {config} from "dotenv";
import {Browser} from "puppeteer";
import {ScraperStrategy} from "./strategies/scraper.strategy";
import {RemoteOkStrategy} from "./strategies/remoteok.strategy";
import {WeWorkRemotelyStrategy} from "./strategies/weworkremotely.strategy";
import {RemoteCoStrategy} from "./strategies/remoteco.strategy";
import {RemotiveStrategy} from "./strategies/remotive.strategy";

config();

puppeteer.use(StealthPlugin());

@Injectable()
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);
  private isCrawling = false;
  private strategies: ScraperStrategy[];

  constructor(
    private readonly jobService: JobService,
    private readonly remoteOkStrategy: RemoteOkStrategy,
    private readonly weWorkRemotelyStrategy: WeWorkRemotelyStrategy,
    private readonly remoteCoStrategy: RemoteCoStrategy,
    private readonly remotiveStrategy: RemotiveStrategy,
  ) {
    this.strategies = [
      remoteOkStrategy,
      remotiveStrategy,
      weWorkRemotelyStrategy,
      remoteCoStrategy,
    ];
  }

  async onModuleInit() {
    this.logger.log("CrawlerService Initialized. Starting first crawl in 5 seconds...");
    setTimeout(() => this.runAllScrapers(), 5000);

    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setInterval(() => this.runAllScrapers(), SIX_HOURS);
  }

  async runAllScrapers() {
    if (this.isCrawling) {
      this.logger.warn("Previous crawl is still running. Skipping this cycle.");
      return;
    }
    this.isCrawling = true;
    this.logger.log("Starting new job crawl cycle...");
    let browser: Browser | null = null;

    try {
      // Only launch browser if at least one strategy needs it (most do except Remotive)
      // For simplicity, we launch it always if we have any strategy that might use it.
      // Or checking strategies content. Remotive doesn't use it but accepts it optional.

      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        defaultViewport: {width: 1280, height: 800},
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      });

      for (const strategy of this.strategies) {
        await this.scrapeSource(strategy, browser);
      }
    } catch (error) {
      this.logger.error(`A critical error occurred in the main crawl loop: ${error.message}`);
    } finally {
      if (browser) await browser.close();
      this.isCrawling = false;
      this.logger.log("Crawl cycle finished and lock released.");
    }
  }

  private async scrapeSource(strategy: ScraperStrategy, browser: Browser) {
    try {
      this.logger.log(`🏃‍♂️ Crawling ${strategy.name}...`);

      // Pass browser to scrape method. Remotive ignores it.
      const jobs = await strategy.scrape(browser);

      this.logger.log(`Discovered ${jobs.length} jobs from ${strategy.name}.`);
      for (const job of jobs) {
        try {
          // jobService.create expects Job or similar. Strategies return Partial<Job>.
          // We need to ensure it's compatible or cast it. using 'as any' for now if type mismatch,
          // but better to fix JobService input type if needed.
          // Assuming JobService.create takes Partial<Job> or compatible DTO.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await this.jobService.create(job as any);
        } catch (e) {
          this.logger.error(`Failed to create job ${job.title}: ${e.message}`);
        }
      }
      this.logger.log(`Finished processing jobs for ${strategy.name}.`);
    } catch (error) {
      this.logger.error(`Failed to crawl ${strategy.name}: ${error.message}`, error.stack);
    }
  }
}
