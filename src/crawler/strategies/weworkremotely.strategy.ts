import {Injectable, Logger} from "@nestjs/common";
import {ScraperStrategy} from "./scraper.strategy";
import {Job} from "../../job/job.entity";
import {Browser, Page} from "puppeteer";
import * as cheerio from "cheerio";
import {JobDescriptionDto} from "../../job/dto/job-description.dto";
import {StealthUtil} from "../utils/stealth.util";

@Injectable()
export class WeWorkRemotelyStrategy implements ScraperStrategy {
  name = "WeWorkRemotely";
  baseUrl = "https://weworkremotely.com/categories/remote-programming-jobs";
  private readonly logger = new Logger(WeWorkRemotelyStrategy.name);

  async scrape(browser: Browser): Promise<Partial<Job>[]> {
    const jobs: Partial<Job>[] = [];

    try {
      const page = await browser.newPage();
      await StealthUtil.applyStealth(page);

      await page.goto(this.baseUrl, {
        waitUntil: "networkidle2",
      });

      await StealthUtil.randomDelay(1000, 2000);

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

          let applyUrl = relativeLink.startsWith("http")
            ? relativeLink
            : "https://weworkremotely.com" + relativeLink;
          const source = "WeWorkRemotely";
          const tags: string[] = [];
          const salary = "";
          const companylogo = "";

          const {detailed, applyUrl: directApplyUrl} = await this.extractJobDetails(
            applyUrl,
            detailPage,
          );

          if (directApplyUrl) {
            applyUrl = directApplyUrl;
          }

          const description = detailed?.roleOverview || `Visit the job link for full description.`;

          if (title && company && applyUrl) {
            const job: Partial<Job> = {
              title,
              company,
              companylogo,
              location,
              salary,
              tags,
              applyUrl,
              source,
              description,
              detailed,
            };

            jobs.push(job);
          }
        } catch (rowError) {
          this.logger.warn(`Failed to process job row ${i + 1}: ${rowError}`);
        }
      }

      await detailPage.close();
      await page.close();
      this.logger.log(`Scraped ${jobs.length} jobs from WeWorkRemotely.`);
    } catch (err) {
      this.logger.error("Error in scraping WeWorkRemotely:", err.message);
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

  private async extractJobDetails(
    url: string,
    page: Page,
  ): Promise<{detailed: JobDescriptionDto; applyUrl?: string}> {
    const result: JobDescriptionDto = {
      requirements: {mustHave: [], niceToHave: []},
      benefits: {health: [], financial: [], timeOff: [], learning: [], other: []},
      responsibilities: [],
      whyJoinUs: [],
      process: [],
    };
    let foundApplyUrl: string | undefined;

    try {
      await page.goto(url, {waitUntil: "networkidle2"});
      const html = await page.content();
      const $ = cheerio.load(html);
      const content = $(".listing-container").text();
      const text = this.cleanText(content);

      // Extract Apply Link
      try {
        const applySelector = "#job-cta-alt"; // Common WWR apply button
        const applyLink = await page
          .$eval(applySelector, (el) => el.getAttribute("href"))
          .catch(() => null);
        if (applyLink) foundApplyUrl = applyLink;
      } catch {
        // ignore
      }

      const extractList = (label: string) => {
        const pattern = new RegExp(`${label}:?\\s*(.*?)((?:[A-Z][a-z]+:)|$)`, "si");
        const match = text.match(pattern);
        return match
          ? match?.[1]
              .split(/[\n\-•]+/)
              .map((s) => this.cleanText(s))
              .filter(Boolean)
          : [];
      };

      result.aboutUs = extractList("About")[0] || "";
      result.roleOverview = text.split("\n")[0];
      result.responsibilities = extractList("Responsibilities");
      if (result.requirements) {
        result.requirements.mustHave = extractList("Must Have");
        result.requirements.niceToHave = extractList("Nice to Have");
      }
      result.whyJoinUs = extractList("Why Join Us");
      result.process = extractList("Interview Process");

      const benefitsList = extractList("Benefits");
      if (result.benefits) {
        for (const benefit of benefitsList) {
          if (/health|insurance/i.test(benefit)) result.benefits.health?.push(benefit);
          else if (/401k|retirement|equity|bonus/i.test(benefit))
            result.benefits.financial?.push(benefit);
          else if (/vacation|leave|pto/i.test(benefit)) result.benefits.timeOff?.push(benefit);
          else if (/learning|course|training/i.test(benefit))
            result.benefits.learning?.push(benefit);
          else result.benefits.other?.push(benefit);
        }
      }
    } catch (err) {
      this.logger.error(`Error extracting WWR job details from ${url}:`, err.message);
    }

    return {detailed: result, applyUrl: foundApplyUrl};
  }
}
