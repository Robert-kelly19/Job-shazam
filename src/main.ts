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
      const frontendUrl = process.env.FRONTEND_URL;

      console.log(`[CORS] Incoming Origin: ${origin}`);
      console.log(`[CORS] Configured Frontend URL: ${frontendUrl}`);

      // Diagnostic bypass
      if (frontendUrl === "ANY") {
        return callback(null, true);
      }

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = ["localhost", "127.0.0.1", "192.168.", "10.0.", "172.16."];

      // Check if origin matches allowed patterns or the specific frontend URL
      if (
        (frontendUrl && origin === frontendUrl) ||
        // Allow Vercel preview deployments
        origin.endsWith(".vercel.app") ||
        allowedOrigins.some((prefix) => origin.includes(prefix))
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
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
