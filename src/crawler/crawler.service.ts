import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {JobService} from "job/job.service";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {config} from "dotenv";
import {Browser} from "puppeteer";
import * as cheerio from "cheerio";

config();

puppeteer.use(StealthPlugin());

interface SoftwareJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  tags: string[];
  applyUrl: string;
  source: string;
  description: string;
  type?: string;
}

enum JobSite {
  RemoteOK = "RemoteOK",
  WeWorkRemotely = "WeWorkRemotely",
  RemoteCo = "Remote.co",
}

@Injectable()
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);
  private isCrawling = false;

  constructor(private readonly jobService: JobService) {}

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
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        defaultViewport: {width: 1280, height: 800},
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      });

      const sitesToCrawl = [JobSite.RemoteOK, JobSite.WeWorkRemotely, JobSite.RemoteCo];

      for (const site of sitesToCrawl) {
        await this.scrapeSource(site, browser);
      }
    } catch (error) {
      this.logger.error(`A critical error occurred in the main crawl loop: ${error.message}`);
    } finally {
      if (browser) await browser.close();
      this.isCrawling = false;
      this.logger.log("Crawl cycle finished and lock released.");
    }
  }

  private async scrapeSource(site: JobSite, browser: Browser) {
    try {
      this.logger.log(`🏃‍♂️ Crawling ${site}...`);
      let jobs: SoftwareJob[] = [];
      if (site === JobSite.RemoteOK) jobs = await this.scrapeRemoteOK(browser);
      if (site === JobSite.WeWorkRemotely) jobs = await this.scrapeWeWorkRemotely(browser);
      if (site === JobSite.RemoteCo) jobs = await this.scrapeRemoteCo(browser);

      this.logger.log(`Discovered ${jobs.length} jobs from ${site}.`);
      for (const job of jobs) {
        await this.jobService.create(job);
      }
      this.logger.log(`Finished processing jobs for ${site}.`);
    } catch (error) {
      this.logger.error(`Failed to crawl ${site}: ${error.message}`, error.stack);
    }
  }

  private async scrapeRemoteOK(browser: Browser): Promise<SoftwareJob[]> {
    const page = await browser.newPage();
    const jobs: SoftwareJob[] = [];
    try {
      await page.goto("https://remoteok.com/remote-dev-jobs", {waitUntil: "domcontentloaded"});

      const html = await page.content();
      const $ = cheerio.load(html);

      const jobRows = $("tr.job").toArray();

      for (const el of jobRows) {
        try {
          const row = $(el);

          // Fallback logic for title
          const title =
            row.find('h2[itemprop="title"]').text().trim() ||
            row.find(".position_title, [class*=position], h3").first().text().trim();

          if (!title) continue;

          const company =
            row.find('h3[itemprop="name"]').text().trim() ||
            row.find(".company, [class*=company], h3").first().text().trim() ||
            "Unknown";

          const salary = row.find(".salary").text().trim() || "Not Specified";

          const tags = row
            .find(".tags .tag, [class*=tag]")
            .map((i, tag) => $(tag).text().trim())
            .get();

          const applyUrl = "https://remoteok.com" + row.attr("data-url");

          // Scrape job description from detail page
          let description = "";
          if (applyUrl) {
            const detailPage = await browser.newPage();
            try {
              await detailPage.goto(applyUrl, {waitUntil: "domcontentloaded"});
              const detailHtml = await detailPage.content();
              const $$ = cheerio.load(detailHtml);

              // Robust description selector fallback logic
              description =
                $$(".description").text().trim() ||
                $$("[class*=description]").text().trim() ||
                $$("div[itemprop='description']").text().trim() ||
                "No description provided.";
            } catch (descErr) {
              description = "Failed to scrape description.";
              this.logger.warn(`Description scrape failed for ${title}: ${descErr.message}`);
            } finally {
              await detailPage.close();
            }
          }

          jobs.push({
            title,
            company,
            location: "Remote",
            salary,
            tags,
            applyUrl,
            source: "RemoteOK",
            description,
            type: "Remote",
          });

          // Random delay to reduce bot detection
          await new Promise((res) => setTimeout(res, Math.random() * 500 + 300));
        } catch (jobErr) {
          this.logger.warn(`Failed to scrape one job listing: ${jobErr.message}`);
        }
      }

      return jobs;
    } finally {
      await page.close();
    }
  }

  private async scrapeWeWorkRemotely(browser: Browser): Promise<SoftwareJob[]> {
    const page = await browser.newPage();
    const jobs: SoftwareJob[] = [];

    try {
      await page.goto("https://weworkremotely.com/categories/remote-programming-jobs", {
        waitUntil: "domcontentloaded",
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      const listings = $("li.new-listing-container").toArray();

      for (const el of listings) {
        try {
          const listing = $(el);

          const title =
            listing.find("h4.new-listing__header__title").text().trim() ||
            listing.find("span.title").text().trim() ||
            "No title";

          const company =
            listing.find("p.new-listing__company-name").text().trim() ||
            listing.find("span.company").text().trim() ||
            "No company";

          const location =
            listing.find("p.new-listing__company-headquarters").text().trim() || "Remote";

          const relativeUrl = listing.find("a").attr("href") || "";
          const applyUrl = relativeUrl.startsWith("http")
            ? relativeUrl
            : "https://weworkremotely.com" + relativeUrl;

          const tags = listing
            .find(".new-listing__categories__category")
            .map((i, tag) => $(tag).text().trim())
            .get();

          //  Random delay to reduce bot detection
          await new Promise((res) => setTimeout(res, Math.random() * 1500 + 500));

          // Fetch job detail page for real description
          let description = "";
          const detailPage = await browser.newPage();

          try {
            await detailPage.goto(applyUrl, {waitUntil: "domcontentloaded"});
            const detailHtml = await detailPage.content();
            const $$ = cheerio.load(detailHtml);

            // Fallback selector logic for description
            description =
              $$(".listing-container").text().trim() ||
              $$("section#job-listing").text().trim() ||
              $$("body").text().trim() ||
              "No description available.";
          } catch (descErr) {
            this.logger.warn(`Failed to scrape description for ${title}: ${descErr.message}`);
            description = "Description scrape failed.";
          } finally {
            await detailPage.close();
          }

          jobs.push({
            title,
            company,
            location,
            description,
            applyUrl,
            tags,
            source: "WeWorkRemotely",
            type: "Remote",
          });
        } catch (jobErr) {
          this.logger.warn(`Failed to scrape a job on WWR: ${jobErr.message}`);
          continue;
        }
      }

      return jobs;
    } catch (err) {
      this.logger.error(`Failed to scrape WeWorkRemotely: ${err.message}`);
      return jobs;
    } finally {
      await page.close();
    }
  }

  private async scrapeRemoteCo(browser: Browser): Promise<SoftwareJob[]> {
    const page = await browser.newPage();
    const jobs: SoftwareJob[] = [];

    try {
      await page.goto("https://remote.co/remote-jobs/developer/", {waitUntil: "domcontentloaded"});
      const html = await page.content();
      const $ = cheerio.load(html);

      const listings = $("div.sc-fBtIwJ.cVivxR").toArray();

      for (const el of listings) {
        try {
          const listing = $(el);

          // Extract job title with fallback
          const title =
            listing.find("a.sc-hLtSKV").text().trim() ||
            listing.find("a").first().text().trim() ||
            "No title";

          // Extract company name with fallback
          const company =
            listing.find("h3.sc-igdSGC").text().trim() ||
            listing.find("h3").first().text().trim() ||
            "No company";

          // Extract location
          const location = listing.find("span.sc-cXghZX").text().trim() || "Remote";

          // Extract salary if available in tags
          const tags = listing
            .find("ul.sc-gVcvut li")
            .map((i, tag) => $(tag).text().trim())
            .get();

          const salary = tags.find((t) => t.toLowerCase().includes("cad")) || "Not Specified";

          // Extract posted date
          // const postedAtRaw = listing.find("div.sc-dUSlRo span").text().trim();
          // const postedAt = postedAtRaw || new Date().toISOString() || "not spacified";

          // Build apply URL
          const relativeUrl = listing.find("a.sc-hLtSKV").attr("href") || "";
          const applyUrl = relativeUrl.startsWith("http")
            ? relativeUrl
            : "https://remote.co" + relativeUrl;

          // Random delay
          await new Promise((res) => setTimeout(res, Math.random() * 1500 + 500));

          // Open detail page to scrape full description
          const description = "Visit the job link for full description.";

          // Push final structured job
          jobs.push({
            title,
            company,
            location,
            salary,
            tags,
            applyUrl,
            source: "Remote.co",
            description,
            type: "Remote",
          });
        } catch (jobErr) {
          this.logger.warn(`Failed to scrape one Remote.co job: ${jobErr.message}`);
          continue;
        }
      }

      return jobs;
    } catch (err) {
      this.logger.error(`Failed to scrape Remote.co: ${err.message}`);
      return jobs;
    } finally {
      await page.close();
    }
  }
}
