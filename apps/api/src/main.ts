import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupPipes, setupHandlebars } from '@app/app.config';

/**
 * Create a NestJs Express application
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'verbose', 'debug'],
  });

  // Set up the session middleware
  // await setupSession(app);

  // Set up pipes
  setupPipes(app);

  // Set up the Handlebars view engine
  setupHandlebars(app);

  await app.listen(process.env.APP_PORT);
}

bootstrap();
