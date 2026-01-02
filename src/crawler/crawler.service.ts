import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {JobService} from "../job/job.service";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {config} from "dotenv";
import {Browser, Page} from "puppeteer";
import * as cheerio from "cheerio";

config();

puppeteer.use(StealthPlugin());

interface JobDescription {
  aboutUs: string;
  roleOverview: string;
  responsibilities: string[];
  requirements: {
    mustHave: string[];
    niceToHave: string[];
  };
  whyJoinUs: string[];
  process: string[];
  benefits: {
    health: string[];
    financial: string[];
    timeOff: string[];
    learning: string[];
    other: string[];
  };
}

interface SoftwareJob {
  title: string;
  company: string;
  companylogo?: string;
  location: string;
  salary: string;
  tags: string[];
  applyUrl: string;
  source: string;
  type: string;
  description: string;
  detailed?: JobDescription;
}

enum JobSite {
  RemoteOK = "RemoteOK",
  WeWorkRemotely = "WeWorkRemotely",
  RemoteCo = "Remote.co",
  Remotive = "Remotive",
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

      const sitesToCrawl = [
        JobSite.RemoteOK,
        JobSite.Remotive,
        JobSite.WeWorkRemotely,
        JobSite.RemoteCo,
      ];

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
      if (site === JobSite.Remotive) jobs = await this.scrapeRemotive();
      if (site === JobSite.WeWorkRemotely) jobs = await this.scrapeWeWorkRemotely(browser);
      if (site === JobSite.RemoteCo) jobs = await this.scrapeRemoteCo(browser);

      this.logger.log(`Discovered ${jobs.length} jobs from ${site}.`);
      for (const job of jobs) {
        try {
          await this.jobService.create(job);
        } catch (e) {
          this.logger.error(`Failed to create job ${job.title}: ${e.message}`);
        }
      }
      this.logger.log(`Finished processing jobs for ${site}.`);
    } catch (error) {
      this.logger.error(`Failed to crawl ${site}: ${error.message}`, error.stack);
    }
  }

  private cleanText(input: string): string {
    if (!input) return "";

    const textWithoutTags = input
      .replace(/<[^>]*>/g, " ")
      .replace(/&[^;\s]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return textWithoutTags;
  }

  private async scrapeRemoteOK(browser: Browser): Promise<SoftwareJob[]> {
    const logger = new Logger("RemoteOK");
    const jobs: SoftwareJob[] = [];

    try {
      const page = await browser.newPage();
      await page.goto("https://remoteok.com/remote-dev+software-jobs", {
        waitUntil: "networkidle2",
      });

      const html = await page.content();
      const $ = cheerio.load(html);
      const rows = $("tr.job");
      const detailPage = await browser.newPage();

      for (let i = 0; i < rows.length; i++) {
        const row = $(rows[i]);

        try {
          const title = this.cleanText(row.find('h2[itemprop="title"]').text());
          const company = this.cleanText(row.find('h3[itemprop="name"]').text());
          const companylogo = row.find("td.has-logo img").attr("src") || "";

          const locations = row
            .find(".location")
            .map((_, loc) => this.cleanText($(loc).text()))
            .get();
          const location = locations.find((l) => !l.includes("$")) || "Remote";
          const salary = locations.find((l) => l.includes("$")) || "";

          const tags = row
            .find("td.tags h3")
            .map((_, tag) => this.cleanText($(tag).text()))
            .get();

          const applyUrl = "https://remoteok.com" + row.attr("data-href");
          const source = "RemoteOK";

          const detailed = await this.extractJobDetails(applyUrl, detailPage);

          if (title && company && applyUrl) {
            const job: SoftwareJob = {
              title,
              company,
              companylogo,
              location,
              salary,
              tags,
              applyUrl,
              source,
              description: detailed?.roleOverview || title,
              detailed,
              type: "Full-time",
            };

            jobs.push(job);
          }
        } catch (rowError) {
          logger.warn(`Failed to process job row ${i + 1}: ${rowError}`);
        }
      }

      await detailPage.close();
      logger.log(`Scraped ${jobs.length} jobs from RemoteOK.`);
      if (jobs.length === 0) logger.warn("No jobs found on RemoteOK.");

      if (jobs.length > 0) {
        logger.log(`Inserting ${jobs.length} jobs into the database.`);
      }
    } catch (err) {
      logger.error("Error in scraping RemoteOK:", err.message);
      logger.debug(err.stack);
    } finally {
      logger.log("RemoteOK job scraping completed.");
    }

    return jobs;
  }

  private async extractJobDetails(url: string, page: Page): Promise<JobDescription> {
    const description: JobDescription = {
      aboutUs: "",
      roleOverview: "",
      responsibilities: [],
      requirements: {
        mustHave: [],
        niceToHave: [],
      },
      whyJoinUs: [],
      process: [],
      benefits: {
        health: [],
        financial: [],
        timeOff: [],
        learning: [],
        other: [],
      },
    };

    try {
      await page.goto(url, {waitUntil: "networkidle2"});
      const html = await page.content();
      const $ = cheerio.load(html);
      const markdown = $(".markdown").text();

      if (!markdown) return description;

      const text = this.cleanText(markdown);

      const extractList = (label: string) => {
        const pattern = new RegExp(`${label}:?\\s*(.*?)((?:[A-Z][a-z]+:)|$)`, "si");
        const match = text.match(pattern);
        return match
          ? match?.[1]
              .split(/[\n\-•]+/)
              .map(this.cleanText)
              .filter(Boolean)
          : [];
      };

      description.aboutUs = extractList("About")[0] || "";
      description.roleOverview = text.split("\n")[0];
      description.responsibilities = extractList("Responsibilities");
      description.requirements.mustHave = extractList("Must Have");
      description.requirements.niceToHave = extractList("Nice to Have");
      description.whyJoinUs = extractList("Why Join Us");
      description.process = extractList("Interview Process");

      const benefitsList = extractList("Benefits");
      for (const benefit of benefitsList) {
        if (/health|insurance/i.test(benefit)) description.benefits.health.push(benefit);
        else if (/401k|retirement|equity|bonus/i.test(benefit))
          description.benefits.financial.push(benefit);
        else if (/vacation|leave|pto/i.test(benefit)) description.benefits.timeOff.push(benefit);
        else if (/learning|course|training/i.test(benefit))
          description.benefits.learning.push(benefit);
        else description.benefits.other.push(benefit);
      }
    } catch (err) {
      console.error(`Error extracting job details from ${url}:`, err.message);
    }

    return description;
  }

  // scrapeRemoteCo and scrapeWeWorkRemotely remain unchanged.
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

          const title = this.cleanText(
            listing.find("a.sc-hLtSKV").text().trim() ||
              listing.find("a").first().text().trim() ||
              "No title",
          );

          const company = this.cleanText(
            listing.find("h3.sc-igdSGC").text().trim() ||
              listing.find("h3").first().text().trim() ||
              "No company",
          );

          const location = this.cleanText(listing.find("span.sc-cXghZX").text().trim() || "Remote");

          const tags = listing
            .find("ul.sc-gVcvut li")
            .map((i, tag) => $(tag).text().trim())
            .get();

          const salary = tags.find((t) => t.toLowerCase().includes("cad")) || "Not Specified";

          const relativeUrl = listing.find("a.sc-hLtSKV").attr("href") || "";
          const applyUrl = relativeUrl.startsWith("http")
            ? relativeUrl
            : "https://remote.co" + relativeUrl;

          await new Promise((res) => setTimeout(res, Math.random() * 1500 + 500));

          const description = "Visit the job link for full description.";

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

  async scrapeWeWorkRemotely(browser: Browser): Promise<SoftwareJob[]> {
    const logger = new Logger("WeWorkRemotely");
    const jobs: SoftwareJob[] = [];

    try {
      const page = await browser.newPage();
      await page.goto("https://weworkremotely.com/categories/remote-programming-jobs", {
        waitUntil: "networkidle2",
      });

      const html = await page.content();
      const $ = cheerio.load(html);
      const rows = $("article ul li:not(.jobs-by-category)");

      const detailPage = await browser.newPage();

      for (let i = 0; i < rows.length; i++) {
        const row = $(rows[i]);

        try {
          const title = this.cleanText(row.find("a span.title").text());
          const company = this.cleanText(row.find("a span.company").text());
          const location = this.cleanText(row.find("a span.region").text() || "Remote");
          const relativeLink = row.find("a").attr("href");
          if (!relativeLink) continue;

          const applyUrl = "https://weworkremotely.com" + relativeLink;
          const source = "WeWorkRemotely";
          const type = "Remote";
          const tags: string[] = [];
          const salary = "";
          const companylogo = "";

          const detailed = await this.extractWeWorkRemotelyDetails(applyUrl, detailPage);

          const description = detailed?.roleOverview || `Visit the job link for full description.`;

          if (title && company && applyUrl) {
            const job: SoftwareJob = {
              title,
              company,
              companylogo,
              location,
              salary,
              tags,
              applyUrl,
              source,
              description,
              type,
              detailed,
            };

            jobs.push(job);
          }
        } catch (rowError) {
          logger.warn(`Failed to process job row ${i + 1}: ${rowError}`);
        }
      }

      await detailPage.close();
      logger.log(`Scraped ${jobs.length} jobs from WeWorkRemotely.`);
      if (jobs.length === 0) logger.warn("No jobs found on WeWorkRemotely.");
    } catch (err) {
      logger.error("Error in scraping WeWorkRemotely:", err.message);
      logger.debug(err.stack);
    } finally {
      logger.log("WeWorkRemotely job scraping completed.");
    }

    return jobs;
  }

  private async extractWeWorkRemotelyDetails(url: string, page: Page): Promise<JobDescription> {
    const description: JobDescription = {
      aboutUs: "",
      roleOverview: "",
      responsibilities: [],
      requirements: {
        mustHave: [],
        niceToHave: [],
      },
      whyJoinUs: [],
      process: [],
      benefits: {
        health: [],
        financial: [],
        timeOff: [],
        learning: [],
        other: [],
      },
    };

    try {
      await page.goto(url, {waitUntil: "networkidle2"});
      const html = await page.content();
      const $ = cheerio.load(html);
      const content = $(".listing-container").text();
      const text = this.cleanText(content);

      const extractList = (label: string) => {
        const pattern = new RegExp(`${label}:?\\s*(.*?)((?:[A-Z][a-z]+:)|$)`, "si");
        const match = text.match(pattern);
        return match
          ? match[1]
              .split(/[\n\-•]+/)
              .map(this.cleanText)
              .filter(Boolean)
          : [];
      };

      description.aboutUs = extractList("About")[0] || "";
      description.roleOverview = text.split("\n")[0];
      description.responsibilities = extractList("Responsibilities");
      description.requirements.mustHave = extractList("Must Have");
      description.requirements.niceToHave = extractList("Nice to Have");
      description.whyJoinUs = extractList("Why Join Us");
      description.process = extractList("Interview Process");

      const benefitsList = extractList("Benefits");
      for (const benefit of benefitsList) {
        if (/health|insurance/i.test(benefit)) description.benefits.health.push(benefit);
        else if (/401k|retirement|equity|bonus/i.test(benefit))
          description.benefits.financial.push(benefit);
        else if (/vacation|leave|pto/i.test(benefit)) description.benefits.timeOff.push(benefit);
        else if (/learning|course|training/i.test(benefit))
          description.benefits.learning.push(benefit);
        else description.benefits.other.push(benefit);
      }
    } catch (err) {
      console.error(`Error extracting WWR job details from ${url}:`, err.message);
    }

    return description;
  }

  private async scrapeRemotive(): Promise<SoftwareJob[]> {
    const logger = new Logger("Remotive");
    const jobs: SoftwareJob[] = [];

    try {
      const res = await fetch("https://remotive.com/api/remote-jobs?category=software-dev");
      const data = await res.json();

      for (const item of data.jobs) {
        try {
          const job: SoftwareJob = {
            title: item.title,
            company: item.company_name,
            companylogo: item.company_logo || "",
            location: item.candidate_required_location || "Remote",
            salary: item.salary || "Not specified",
            tags: item.tags || [],
            applyUrl: item.url,
            source: "Remotive",
            description: this.cleanText(item.description),
            type: item.job_type || "Remote",
          };

          jobs.push(job);
        } catch (err) {
          logger.warn(`Failed to process a Remotive job: ${err.message}`);
        }
      }

      logger.log(`Scraped ${jobs.length} jobs from Remotive.`);
      if (jobs.length > 0) {
        logger.log(`Inserting ${jobs.length} jobs into the database.`);
      }
    } catch (err) {
      logger.error(`Failed to fetch Remotive jobs: ${err.message}`);
    }

    return jobs;
  }
}
