import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {Browser, Page} from "puppeteer";
import * as cheerio from "cheerio";
import {JobService} from "job/job.service";

puppeteer.use(StealthPlugin());

interface SoftwareJob {
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  postedAt: string;
  applyUrl: string;
  source: string;
  description: string;
  type?: string;
  category?: string;
  requirements?: string[];
  benefits?: string[];
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(private readonly jobService: JobService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async scrapeRemoteOkJobs(): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      this.logger.log("Launching puppeteer browser...");
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      page = await browser.newPage();

      this.logger.log("Navigating to RemoteOK...");
      await page.goto("https://remoteok.com/remote-dev-jobs", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      const jobs: SoftwareJob[] = [];

      const jobRows = $("tr.job");

      this.logger.log(`Found ${jobRows.length} jobs on RemoteOK`);

      for (let i = 0; i < jobRows.length; i++) {
        const el = jobRows[i];
        const row = $(el);

        const title = row.find("h2").text().trim() || "No title";
        const company = row.find(".companyLink h3").text().trim() || "No company";
        const location = row.find(".location").text().trim() || "Remote";
        const salary = row.find(".salary").text().trim() || "Not Specified";
        const postedAt = row.find("time").attr("datetime") || new Date().toISOString();
        const applyUrl = row.attr("data-url") ? `https://remoteok.com${row.attr("data-url")}` : "";

        const tags: string[] = [];
        row.find(".tag").each((i, el) => {
          const tag = $(el).text().trim();
          if (tag) tags.push(tag);
        });

        // Visit each job's applyUrl to extract full description
        let description = "";
        if (applyUrl) {
          try {
            this.logger.log(`Fetching job description for: ${title}`);
            await page.goto(applyUrl, {
              waitUntil: "networkidle2",
              timeout: 60000,
            });
            const jobHtml = await page.content();
            const $$ = cheerio.load(jobHtml);

            // Inspect the job detail page in browser to identify correct selector
            description = $$(".description").text().trim() || "No description found";
            this.logger.log(`Fetched description for ${description} characters`);
          } catch (descErr) {
            this.logger.error(`Error fetching description for ${title}: ${descErr.message}`);
            description = "Failed to fetch description";
          }
        }

        const job: SoftwareJob = {
          title,
          company,
          location,
          salary,
          tags,
          postedAt,
          applyUrl,
          source: "remoteok",
          description,
        };

        jobs.push(job);
      }

      this.logger.debug(JSON.stringify(jobs.slice(0, 3), null, 2));
      this.logger.log(`Scraped ${jobs.length} jobs with descriptions from RemoteOK.`);

      // Store in DB via JobService
      for (const job of jobs) {
        await this.jobService.create(job);
      }
    } catch (error) {
      this.logger.error(`Error scraping RemoteOK: ${error.message}`, error.stack);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
      this.logger.log("Puppeteer browser closed.");
    }
  }
}
