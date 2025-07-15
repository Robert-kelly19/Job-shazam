import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
// import {Cron, CronExpression } from "@nestjs/schedule";
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
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(private readonly jobService: JobService) {}

  async onModuleInit() {
    this.logger.log("CrawlerService initializing... Running all scrapers now.");

    // Run immediately on startup
    await this.runAllScrapers();

    // Schedule to run every 10 hours thereafter
    const TEN_HOURS = 10 * 60 * 60 * 1000;
    setInterval(async () => {
      this.logger.log("Running all scrapers on 10-hour interval...");
      await this.runAllScrapers();
    }, TEN_HOURS);
  }

  async runAllScrapers() {
    try {
      await this.scrapeRemoteOkJobs();
    } catch (err) {
      this.logger.error("RemoteOK scraper failed", err.stack);
    }

    // try {
    //   await this.scrapeWorkingNomads();
    // } catch (err) {
    //   this.logger.error("WorkingNomads scraper failed", err.stack);
    // }

    try {
      await this.scrapeRemoteCo();
    } catch (err) {
      this.logger.error("Remote.co scraper failed", err.stack);
    }
  }
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
            await page.goto(applyUrl, {
              waitUntil: "networkidle2",
              timeout: 60000,
            });
            const jobHtml = await page.content();
            const $$ = cheerio.load(jobHtml);

            // Inspect the job detail page in browser to identify correct selector
            description =
              $$(".description").text().trim().replace(/\s+/g, " ") || "No description found";

            if (!description || description === "No description found") {
              this.logger.warn(`No description found for ${title}. Check page structure.`);
            }
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

  // async scrapeWorkingNomads() {
  //   this.logger.log("Running Working Nomads crawler...");
  //   let browser: Browser | null = null;
  //   let page: Page | null = null;

  //   try {
  //     browser = await puppeteer.launch({headless: true, args: ["--no-sandbox"]});
  //     page = await browser.newPage();

  //     await page.goto("https://www.workingnomads.co/jobs?category=software-dev", {
  //       waitUntil: "networkidle2",
  //       timeout: 60000,
  //     });

  //     const html = await page.content();
  //     const $ = cheerio.load(html);
  //     const jobs: SoftwareJob[] = [];

  //     const jobLinks: string[] = [];

  //     $("div.job-desktop h4.hidden-xs a").each((i, el) => {
  //       const link = $(el).attr("href");
  //       if (link) {
  //         jobLinks.push("https://www.workingnomads.co" + link);
  //       }
  //     });

  //     for (const link of jobLinks) {
  //       const jobPage = await browser.newPage();
  //       await jobPage.goto(link, {waitUntil: "networkidle2", timeout: 60000});
  //       const jobHtml = await jobPage.content();
  //       const $$ = cheerio.load(jobHtml);

  //       const title = $$("h1").text().trim() || "No title";
  //       const company = $$("div.company-name").text().trim() || "No company";
  //       const location = "Remote";
  //       const postedAt = new Date().toISOString(); // Use current time as placeholder

  //       await jobPage.waitForSelector("div#job_description", {timeout: 10000}).catch(() => {});

  //       const description = $$("p.jobDescription").html()?.trim() || "No description fetched";

  //       const tags: string[] = [];
  //       $$("div.tags a").each((i, el) => {
  //         const tag = $$(el).text().trim();
  //         if (tag) tags.push(tag);
  //       });

  //       const job: SoftwareJob = {
  //         title,
  //         company,
  //         location,
  //         salary: "Not specified",
  //         tags,
  //         postedAt,
  //         applyUrl: link,
  //         source: "workingnomads",
  //         description,
  //       };

  //       jobs.push(job);

  //       await jobPage.close(); // Close each tab after scraping
  //     }

  //     this.logger.log(`Scraped ${jobs.length} jobs from Working Nomads.`);
  //     for (const job of jobs) {
  //       await this.jobService.create(job);
  //     }
  //   } catch (err) {
  //     this.logger.error(`Error scraping Working Nomads: ${err.message}`, err.stack);
  //   } finally {
  //     if (page) await page.close();
  //     if (browser) await browser.close();
  //   }
  // }

  async scrapeRemoteCo() {
    this.logger.log("Running Remote.co crawler...");
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await puppeteer.launch({headless: true, args: ["--no-sandbox"]});
      page = await browser.newPage();

      await page.goto("https://remote.co/remote-jobs/developer/", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);
      const jobs: SoftwareJob[] = [];

      $(".job_listing").each((i, el) => {
        const title = $(el).find(".position h3").text().trim() || "No title";
        const company = $(el).find(".company h4").text().trim() || "No company";
        const location = "Remote";
        const postedAt = new Date().toISOString();
        const applyUrl = $(el).find("a").attr("href") || "";
        const tags: string[] = [];

        const job: SoftwareJob = {
          title,
          company,
          location,
          salary: "Not specified",
          tags,
          postedAt,
          applyUrl,
          source: "remote.co",
          description: "No description fetched yet",
        };

        jobs.push(job);
      });

      this.logger.log(`Scraped ${jobs.length} jobs from Remote.co.`);
      for (const job of jobs) {
        await this.jobService.create(job);
      }
    } catch (err) {
      this.logger.error(`Error scraping Remote.co: ${err.message}`, err.stack);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}
