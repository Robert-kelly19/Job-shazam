import {Injectable, Logger} from "@nestjs/common";
import {ScraperStrategy} from "./scraper.strategy";
import {Job} from "../../job/job.entity";

@Injectable()
export class RemotiveStrategy implements ScraperStrategy {
  name = "Remotive";
  baseUrl = "https://remotive.com/api/remote-jobs?category=software-dev";
  private readonly logger = new Logger(RemotiveStrategy.name);

  async scrape(): Promise<Partial<Job>[]> {
    const jobs: Partial<Job>[] = [];

    try {
      const res = await fetch(this.baseUrl);
      const data = await res.json();

      for (const item of data.jobs) {
        try {
          // Verify if fields exist
          const job: Partial<Job> = {
            title: item.title,
            company: item.company_name,
            companylogo: item.company_logo || "",
            location: item.candidate_required_location || "Remote",
            salary: item.salary || "Not specified",
            tags: item.tags || [],
            applyUrl: item.url,
            source: "Remotive",
            description: this.cleanText(item.description),
            // type: item.job_type || 'Remote',
          };

          jobs.push(job);
        } catch (err) {
          this.logger.warn(`Failed to process a Remotive job: ${err.message}`);
        }
      }

      this.logger.log(`Scraped ${jobs.length} jobs from Remotive.`);
    } catch (err) {
      this.logger.error(`Failed to fetch Remotive jobs: ${err.message}`);
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
