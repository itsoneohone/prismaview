import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  setupPipes,
  setupHandlebars,
  APP_PORT,
} from 'src/app-config/app-config';

/**
 * Create a NestJs Express application
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Set up the session middleware
  // await setupSession(app);

  // Set up pipes
  setupPipes(app);

  // Set up the Handlebars view engine
  setupHandlebars(app);

  await app.listen(APP_PORT);
}

bootstrap();
