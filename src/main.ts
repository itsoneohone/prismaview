import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // redis connection logic
  const redisClient = createClient({
    url: configService.get('REDIS_URL'),
  });

  // Set up the session middleware
  app.use(
    session({
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({
        client: redisClient,
      }),
    }),
  );

  // Connect to redis
  await redisClient.connect().catch((error) => {
    throw error;
  });

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
