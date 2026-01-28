import {Injectable, OnModuleInit, Logger} from "@nestjs/common";
import {DataSource} from "typeorm";

@Injectable()
export class AppService implements OnModuleInit {
  getHello(): string {
    return "Hello World!";
  }
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly datasource: DataSource) {}

  async onModuleInit() {
    try {
      if (!this.datasource.isInitialized) {
        await this.datasource.initialize();
      }
      this.logger.log("connected to database successfully");
    } catch (error) {
      this.logger.error("error while connecting to database", error.message);
    }
  }

  async checkDbStatus() {
    try {
      // 1. Check if connection is alive
      const isInitialized = this.datasource.isInitialized;

      // 2. Check if the 'job' table exists (common source of 500 on /jobs)
      // This will throw if the table doesn't exist
      const jobCount = await this.datasource.query('SELECT COUNT(*) FROM "job"');

      return {
        status: "OK",
        database: isInitialized ? "Connected" : "Disconnected",
        tables: {
          job: "Found",
          count: jobCount[0].count,
        },
      };
    } catch (error) {
      return {
        status: "ERROR",
        message: error.message,
        hint: error.message.includes('relation "job" does not exist')
          ? "The database schema is missing. You need to enable 'synchronize: true' in app.module.ts for the first run."
          : "Check your DATABASE_URL and SSL settings.",
      };
    }
  }
}
