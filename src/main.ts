import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {Logger} from "@nestjs/common";
import {CorsOptions} from "@nestjs/common/interfaces/external/cors-options.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins: string[] = ["http://localhost:3000"];

  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  };

  app.enableCors(corsOptions);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.debug(`Server running on: ${port}`);
}
bootstrap();
