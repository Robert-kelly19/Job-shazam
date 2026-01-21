import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {Logger, ValidationPipe} from "@nestjs/common";
import {CorsOptions} from "@nestjs/common/interfaces/external/cors-options.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true}));

  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow localhost, 127.0.0.1, and any local network addresses
      if (!origin) {
        callback(null, true);
      } else if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("192.168.") ||
        origin.includes("10.0.") ||
        origin.includes("172.16.")
      ) {
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
  Logger.log(`Server running on: ${port}`);
}
bootstrap();
