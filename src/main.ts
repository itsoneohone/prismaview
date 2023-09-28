import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up the session middleware
  app.use(
    session({
      secret: 'super_secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  // Global param validator
  // - Transform param to the expected type as defined by TS
  // - Apply validation rules to our DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Delete any values from the body which does not have a decorator
      whitelist: true,
    }),
  );

  await app.listen(3333);
}

bootstrap();
