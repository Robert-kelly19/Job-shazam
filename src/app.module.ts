import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
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
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST"),
        username: config.get<string>("DB_USER"),
        password: config.get<string>("DB_PASSWORD"),
        database: config.get<string>("DB_NAME"),
        port: config.get<number>("DB_PORT"),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    CrawlerModule,
  ],
})
export class AppModule {}
