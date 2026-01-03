import {Injectable, Logger} from "@nestjs/common";
import {ScraperStrategy} from "./scraper.strategy";
import {Job} from "../../job/job.entity";
import {Browser, Page} from "puppeteer";
import * as cheerio from "cheerio";
import {JobDescriptionDto} from "../../job/dto/job-description.dto";
import {StealthUtil} from "../utils/stealth.util";

@Injectable()
export class RemoteOkStrategy implements ScraperStrategy {
  name = "RemoteOK";
  baseUrl = "https://remoteok.com/remote-dev+software-jobs";
  private readonly logger = new Logger(RemoteOkStrategy.name);

  async scrape(browser: Browser): Promise<Partial<Job>[]> {
    const jobs: Partial<Job>[] = [];

    try {
      const page = await browser.newPage();
      await StealthUtil.applyStealth(page);

      await page.goto(this.baseUrl, {
        waitUntil: "networkidle2",
      });

      await StealthUtil.randomDelay(1000, 3000);

      const html = await page.content();
      const $ = cheerio.load(html);
      const rows = $("tr.job");
      const detailPage = await browser.newPage();
      await StealthUtil.applyStealth(detailPage);

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

          const relativeUrl = row.attr("data-href");
          let applyUrl = "https://remoteok.com" + relativeUrl;
          const source = "RemoteOK";

          await StealthUtil.randomDelay(500, 1500); // Delay between details
          const {detailed, applyUrl: directApplyUrl} = await this.extractJobDetails(
            applyUrl,
            detailPage,
          );

          if (directApplyUrl) {
            applyUrl = directApplyUrl;
          }

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
              description: detailed?.roleOverview || title,
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
      this.logger.log(`Scraped ${jobs.length} jobs from RemoteOK.`);
    } catch (err) {
      this.logger.error("Error in scraping RemoteOK:", err.message);
    }

    return jobs;
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
      const markdown = $(".markdown").text();

      try {
        const applySelector = "a.prevent-default.apply";
        const applyLink = await page
          .$eval(applySelector, (el) => el.getAttribute("href"))
          .catch(() => null);

        if (applyLink) {
          const fullApplyLink = applyLink.startsWith("/")
            ? "https://remoteok.com" + applyLink
            : applyLink;
          foundApplyUrl = fullApplyLink;
        }
      } catch {
        // ignore
      }

      if (markdown) {
        const text = this.cleanText(markdown);

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
      }
    } catch (err) {
      console.error(`Error extracting job details from ${url}:`, err.message);
    }

    return {detailed: result, applyUrl: foundApplyUrl};
  }
}
