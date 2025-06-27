import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {UserModule} from "user/user.module";
import {SavedJobModule} from "saved-job/saved-job.module";
import {JobModule} from "job/job.module";
import {ScheduleModule} from "@nestjs/schedule";
import {CrawlerModule} from "./crawler/crawler.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CrawlerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const envFile = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT", "NODE_ENV"];
        for (const envVar of envFile) {
          if (!config.get(envVar)) {
            throw new Error(`environment variables are missing check your .env file:${envVar}`);
          }
        }
        return {
          type: "postgres",
          host: config.get<string>("DB_HOST"),
          username: config.get<string>("DB_USER"),
          password: config.get<string>("DB_PASSWORD"),
          database: config.get<string>("DB_NAME"),
          port: config.get<number>("DB_PORT"),
          autoLoadEntities: true,
          synchronize: config.get<string>("NODE_ENV") !== "production",
        };
      },
    }),
    UserModule,
    SavedJobModule,
    JobModule,
    CrawlerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
