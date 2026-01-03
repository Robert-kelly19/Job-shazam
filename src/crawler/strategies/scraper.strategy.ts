import {Job} from "../../job/job.entity";
import {Browser} from "puppeteer";

export interface ScraperStrategy {
  name: string;
  baseUrl: string;

  scrape(browser?: Browser): Promise<Partial<Job>[]>;
}
