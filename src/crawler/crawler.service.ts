import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import * as puppeteer from "puppeteer";

@Injectable()
export class CrawlerService {
  // add Logger to see output first
  private readonly logger = new Logger(CrawlerService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.log("Starting Scheduled Job discovery");
    await this.discoverIndeedJobUrls("software Engineer", "New York, NY");
  }

  // discoverIndeedJobUrls
  async discoverIndeedJobUrls(searchTerm: string, location: string) {
    this.logger.log("Lunching browser for Indeed scraping..!");
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(
      searchTerm,
    )}&l=${encodeURIComponent(location)}`;
    this.logger.log(`Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, {waitUntil: "networkidle2"});

    const jobLinks = await page.evaluate(() => {
      const links: string[] = [];
      const elements = document.querySelectorAll<HTMLAnchorElement>(
        ".jobsearch-SerpJobCard a.jcs-JobTitle",
      );
      elements.forEach((el) => {
        links.push(el.href);
      });
      return links;
    });

    this.logger.log(`Discover ${jobLinks.length} job URLs from Indeed.`);
    console.log(jobLinks);

    await browser.close();
    return jobLinks;
  }
}
