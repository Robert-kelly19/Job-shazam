import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import * as puppeteer from "puppeteer";
import {Browser} from "puppeteer";

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser | null = null;

  // Run every 5 minutes (adjust as needed)
  @Cron(CronExpression.EVERY_30_SECONDS)
  async crawlSoftwareJobs() {
    this.logger.log("Starting software engineering jobs crawl...");
    try {
      this.browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        headless: true, // Use new headless mode
      });

      const jobs = await this.scrapeSoftwareJobs();

      if (jobs.length > 0) {
        this.logger.log(`Found ${jobs.length} software engineering jobs`);
        // Process jobs as needed (save to DB, send notifications, etc.)
        console.log("Software Jobs:", jobs);
      } else {
        this.logger.warn("No software engineering jobs found");
      }
    } catch (error) {
      this.logger.error("Crawling failed", error.stack);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async scrapeSoftwareJobs(): Promise<SoftwareJob[]> {
    if (!this.browser) throw new Error("Browser not initialized");
    const page = await this.browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    );

    try {
      await page.goto("https://remoteok.com/remote-dev-jobs", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      // Wait for job listings to load
      await page.waitForSelector("tr.job", {timeout: 5000});

      const jobs = await page.evaluate(() => {
        const jobElements = Array.from(document.querySelectorAll("tr.job:not(.expand)"));

        return jobElements.map((jobEl) => {
          // Extract basic information
          const title = jobEl.querySelector('h2[itemprop="title"]')?.textContent?.trim() || "";
          const company = jobEl.querySelector('h3[itemprop="name"]')?.textContent?.trim() || "";

          // Extract location and salary
          const locationDiv = jobEl.querySelector("div.location");
          const location = locationDiv?.textContent?.trim() || "Remote";

          // --- FIX FOR SALARY ---
          let salary = "Not specified";
          const salaryText = locationDiv?.nextElementSibling?.textContent?.trim() || "";
          if (salaryText.includes("$") || salaryText.includes("€")) {
            salary = salaryText;
          }

          // --- FIX FOR TAGS ---
          const tags = Array.from(jobEl.querySelectorAll("td.tags h3")) // Simpler selector
            .map((tag) => tag.textContent?.trim())
            .filter((tag): tag is string => !!tag);

          // Extract posting date
          const postedAt = jobEl.querySelector("time")?.getAttribute("datetime") || "";

          // Extract apply URL
          const applyLink = jobEl.querySelector("a.preventLink") as HTMLAnchorElement;
          const applyUrl = applyLink?.pathname ? `${applyLink.href}` : "";

          return {
            title,
            company,
            location,
            salary,
            tags,
            postedAt,
            applyUrl,
            source: "RemoteOK",
          };
        });
      });

      // More inclusive filtering
      const softwareJobs = jobs.filter((job) => {
        // Check if title contains relevant keywords
        const titleMatch =
          /(software|backend|frontend|full.?stack|devops|mobile|developer|engineer)/i.test(
            job.title,
          );

        // Check if tags contain relevant keywords
        const tagsMatch = job.tags.some((tag) =>
          /(software|backend|frontend|full.?stack|devops|mobile|developer|engineer)/i.test(tag),
        );

        return titleMatch || tagsMatch;
      });

      return softwareJobs;
    } catch (error) {
      this.logger.error(`Scraping failed: ${error.message}`);
      return [];
    } finally {
      await page.close();
    }
  }
}

interface SoftwareJob {
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  postedAt: string;
  applyUrl: string;
  source: string;
}
