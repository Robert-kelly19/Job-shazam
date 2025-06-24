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
      this.logger.error("error while connecting to database");
      throw error;
    }
  }
}
