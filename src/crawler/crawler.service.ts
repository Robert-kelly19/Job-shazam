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
  aboutUs?: string;
  roleOverview?: string;
  responsibilities?: string[];
  requirements?: string[];
  whyJoinUs?: string[];
  process?: string;
  benefits?: string[];
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

  // --- RemoteOK scraper with integrated detail parse ---
  private async scrapeRemoteOK(browser: Browser): Promise<SoftwareJob[]> {
    const page = await browser.newPage();
    const jobs: SoftwareJob[] = [];

    await page.goto("https://remoteok.com/remote-dev-jobs", {waitUntil: "networkidle2"});

    // 1) Grab all listing-page data in one go
    const listings = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("tr.job"))
        .map((row: HTMLTableRowElement) => {
          // Title & Company
          const title = row.querySelector('h2[itemprop="title"]')?.textContent?.trim() ?? "";
          const company =
            row.querySelector('h3[itemprop="name"]')?.textContent?.trim() ?? "Unknown";
          if (!title) return null;

          // Salary — pick the first .location that has $, €, or £
          const salary =
            Array.from(row.querySelectorAll("td.company .location"))
              .map((el) => el.textContent ?? "")
              .filter((txt) => /[$€£]/.test(txt))
              .map((txt) => txt.replace(/^[^\d$€£]+|[^\d\-–$€£ ]+$/g, "").trim())[0] ||
            "Not Specified";

          // Tags — only the <h3> text, collapse whitespace
          const tags = Array.from(row.querySelectorAll("td.tags .tag h3"))
            .map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "")
            .filter(Boolean)
            // dedupe
            .filter((v, i, a) => a.indexOf(v) === i);

          // Apply URL
          let applyUrl = row.getAttribute("data-url") ?? "";
          if (!applyUrl.startsWith("http")) {
            applyUrl = "https://remoteok.com" + applyUrl;
          }

          return {title, company, salary, tags, applyUrl};
        })
        .filter((x) => x !== null);
    });

    // Loop detail pages to scrape the first three p under .html
    for (const job of listings as Array<{
      title: string;
      company: string;
      salary: string;
      tags: string[];
      applyUrl: string;
    }>) {
      // default fallbacks
      let aboutUs = "Not Specified";
      let roleOverview = "Not Specified";
      let responsibilities = ["Not Specified"];
      let requirements = ["Not Specified"];
      let whyJoinUs = ["Not Specified"];
      let process = "Not Specified";
      let detailSalary = job.salary; // listing fallback
      let benefits = ["Not Specified"];
      let description = "Apply on the job link for full description.";

      try {
        const detailPage = await browser.newPage();
        await detailPage.goto(job.applyUrl, {waitUntil: "networkidle2"});

        const data = await detailPage.evaluate(() => {
          const container = document.querySelector("div.html");
          if (!container) return null;

          // strip heading text from its paragraph
          function stripHeading(p: HTMLParagraphElement, heading: string) {
            return (
              (p.textContent || "").replace(heading, "").replace(/\s+/g, " ").trim() ||
              "Not Specified"
            );
          }

          // find a p.p1 with strong then grab its text minus the bold
          const paras = Array.from(container.querySelectorAll("p.p1"));
          let about = "Not Specified";
          let role = "Not Specified";
          let proc = "Not Specified";

          paras.forEach((p) => {
            const s = p.querySelector("strong")?.textContent || "";
            if (s.includes("About Us")) about = stripHeading(p as HTMLParagraphElement, s);
            else if (s.includes("Role Overview")) role = stripHeading(p as HTMLParagraphElement, s);
            else if (s.includes("About the Process"))
              proc = stripHeading(p as HTMLParagraphElement, s);
          });

          // helper to read the <ul> immediately after a heading <p>
          function listAfter(label: string): string[] {
            const p = paras.find((x) =>
              (x.querySelector("strong")?.textContent || "").includes(label),
            );
            if (!p) return ["Not Specified"];
            const ul = p.nextElementSibling;
            if (!(ul instanceof HTMLUListElement)) return ["Not Specified"];
            const items = Array.from(ul.querySelectorAll("li"))
              .map((li) => li.textContent?.trim() || "")
              .filter((t) => !!t);
            return items.length ? items : ["Not Specified"];
          }

          const resp = listAfter("What You’ll Do");
          const reqs = listAfter("What We’re Looking For");
          const why = listAfter("Why Join Us");

          // Salary under its <h2>
          let sal = "Not Specified";
          const h2s = Array.from(container.querySelectorAll("h2"));
          const salH2 = h2s.find((h) => h.textContent?.includes("Salary and compensation"));
          if (salH2) {
            let txt = "";
            let el = salH2.nextElementSibling;
            while (el && el.tagName !== "H2") {
              txt += el.textContent || "";
              el = el.nextElementSibling;
            }
            sal = txt.replace(/\s+/g, " ").trim() || "Not Specified";
          }

          // Benefits paragraphs
          let ben: string[] = ["Not Specified"];
          const benH2 = h2s.find((h) => h.textContent?.includes("Benefits"));
          if (benH2) {
            const items: string[] = [];
            let el = benH2.nextElementSibling;
            while (el && el.tagName === "P") {
              const t = (el.textContent || "").trim();
              if (t) items.push(t);
              el = el.nextElementSibling;
            }
            if (items.length) ben = items;
          }

          // build a short description: first 3 paragraphs
          const descParas = Array.from(container.querySelectorAll("p"))
            .slice(0, 3)
            .map((p) => (p.textContent || "").replace(/\s+/g, " ").trim())
            .filter((t) => !!t);
          const desc = descParas.length
            ? descParas.join("\n\n")
            : "Apply on the job link for full description.";

          return {
            aboutUs: about,
            roleOverview: role,
            responsibilities: resp,
            requirements: reqs,
            whyJoinUs: why,
            process: proc,
            salary: sal,
            benefits: ben,
            description: desc,
          };
        });

        await detailPage.close();

        if (data) {
          aboutUs = data.aboutUs;
          roleOverview = data.roleOverview;
          responsibilities = data.responsibilities;
          requirements = data.requirements;
          whyJoinUs = data.whyJoinUs;
          process = data.process;
          detailSalary = data.salary || job.salary;
          benefits = data.benefits;
          description = data.description;
        }
      } catch (err) {
        this.logger.warn(`Detail parse failed for ${job.title}: ${err.message}`);
      }

      jobs.push({
        title: job.title,
        company: job.company,
        location: "Remote",
        salary: detailSalary,
        tags: job.tags,
        applyUrl: job.applyUrl,
        source: "RemoteOK",
        description, // clean plaintext
        type: "Remote",
        aboutUs, // structured fields
        roleOverview,
        responsibilities,
        requirements,
        whyJoinUs,
        process,
        benefits,
      });

      await new Promise((r) => setTimeout(r, Math.random() * 500 + 300));
    }

    await page.close();
    return jobs;
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

          const salary =
            listing
              .find(".new-listing__categories__category")
              .filter(function () {
                return $(this).text().includes("$");
              })
              .first()
              .text()
              .trim() || "Not Specified";

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
            salary,
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
