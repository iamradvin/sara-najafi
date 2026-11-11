import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { resolve } from "node:path";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { getWebOrigins } from "./common/web-origins";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: getWebOrigins(config),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks(undefined, { useProcessExit: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SaraNajafi API")
    .setDescription("رابط برنامه‌نویسی پلتفرم آموزشی سارا نجفی")
    .setVersion("1.0")
    .addSecurity("attractory_session", {
      type: "apiKey",
      in: "cookie",
      name: "attractory_session",
    })
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>("API_PORT", 4000);
  app.useStaticAssets(
    resolve(config.get<string>("COURSE_UPLOAD_DIR") || "uploads"),
    { prefix: "/uploads/" },
  );
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
