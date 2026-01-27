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
      const listings = $("div.sc-fBtIwJ.cVivxR").toArray().slice(0, 10); // Limit to 10 for performance and to avoid blocks

      const detailPage = await browser.newPage();
      await StealthUtil.applyStealth(detailPage);

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
          await StealthUtil.randomDelay(500, 1500);

          let description = "Visit the job link for full description.";
          try {
            await detailPage.goto(applyUrl, {waitUntil: "domcontentloaded"});
            const detailHtml = await detailPage.content();
            const $detail = cheerio.load(detailHtml);
            const rawDescription = $detail(".job_description").html();
            if (rawDescription) {
              description = this.cleanHtml(rawDescription);
            }
          } catch (detailErr) {
            this.logger.warn(`Failed to scrape details for ${applyUrl}: ${detailErr.message}`);
          }

          const job: Partial<Job> = {
            title,
            company,
            location,
            salary,
            tags,
            applyUrl,
            source: "Remote.co",
            description,
          };
          jobs.push(job);
        } catch (jobErr) {
          this.logger.warn(`Failed to scrape one Remote.co job: ${jobErr}`);
        }
      }
      await detailPage.close();
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

  private cleanHtml(html: string): string {
    if (!html) return "";
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script, style, iframe, link, meta, svg, path").remove();

    // Remove all attributes except href for links
    $("*").each((i, el) => {
      if (el.type === "tag") {
        const element = $(el);
        const name = el.name;
        const attribs = el.attribs;

        for (const attr in attribs) {
          if (attr !== "href" || name !== "a") {
            element.removeAttr(attr);
          }
        }
      }
    });

    // Extract content from body/html if cheerio added them
    return $("body").html()?.trim() || $.html().trim();
  }
}
