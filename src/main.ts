import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
// import * as redisStore from 'cache-manager-redis-store';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // redis connection logic
  // const RedisStore = connectRedis(session);
  const redisClient = createClient({
    url: 'redis://localhost:6379',
  });

  // Set up the session middleware
  app.use(
    session({
      secret: 'super_secret',
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
