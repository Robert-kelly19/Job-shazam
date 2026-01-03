import {Injectable, Logger} from "@nestjs/common";
import {ScraperStrategy} from "./scraper.strategy";
import {Job} from "../../job/job.entity";
import {Browser} from "puppeteer";
import * as cheerio from "cheerio";
import {StealthUtil} from "../utils/stealth.util";

@Injectable()
export class RemoteCoStrategy implements ScraperStrategy {
  name = "Remote.co";
  baseUrl = "https://remote.co/remote-jobs/developer/";
  private readonly logger = new Logger(RemoteCoStrategy.name);

  async scrape(browser: Browser): Promise<Partial<Job>[]> {
    const jobs: Partial<Job>[] = [];
    const page = await browser.newPage();
    await StealthUtil.applyStealth(page);

    try {
      await page.goto(this.baseUrl, {waitUntil: "domcontentloaded"});

      await StealthUtil.randomDelay(1000, 3000);

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

          // Stealth delay
          await StealthUtil.randomDelay(200, 800);

          const description = "Visit the job link for full description.";

          const job: Partial<Job> = {
            title,
            company,
            location,
            salary,
            tags,
            applyUrl,
            source: "Remote.co",
            description,
            // type: 'Remote',
          };
          jobs.push(job);
        } catch (jobErr) {
          this.logger.warn(`Failed to scrape one Remote.co job: ${jobErr}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to scrape Remote.co: ${err.message}`);
    } finally {
      await page.close();
    }

    return jobs;
  }

  private cleanText(input: string): string {
    if (!input) return "";
    return input
      .replace(/<[^>]*>/g, " ")
      .replace(/&[^;\s]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
