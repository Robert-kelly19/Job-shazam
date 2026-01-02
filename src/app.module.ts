import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {UserModule} from "./user/user.module";
import {SavedJobModule} from "./saved-job/saved-job.module";
import {JobModule} from "./job/job.module";
import {ScheduleModule} from "@nestjs/schedule";
import {CrawlerModule} from "./crawler/crawler.module";
import {MailModule} from "./mail/mail.module";
import {AuthModule} from "./auth/auth.module";
import {User} from "./user/user.entity";
import {SavedJob} from "./saved-job/saved-job.entity";
import {Job} from "./job/job.entity";
import {MatchModule} from "./match/match.module";

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
        const requiredEnvs = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"];
        for (const envVar of requiredEnvs) {
          if (!config.get(envVar)) {
            throw new Error(`Missing environment variable for local DB setup: ${envVar}`);
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
          entities: [User, SavedJob, Job],
          synchronize: config.get<string>("NODE_ENV") !== "production",
        };
      },
    }),
    UserModule,
    SavedJobModule,
    JobModule,
    MailModule,
    AuthModule,
    MatchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
