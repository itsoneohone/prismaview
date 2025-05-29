import { join } from 'path';
import * as morgan from 'morgan';
import * as session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as hbs from 'hbs';
import { ValidationError } from 'class-validator';
import type { Request } from 'express';

/**
 * Set up Morgan HTTP request logging
 *
 * @param app NestExpressApplication
 */
export function setupMorgan(app: NestExpressApplication) {
  app.use(
    morgan('dev', {
      skip: (req: Request) => req.path === '/status',
    }),
  );
}

/**
 * Setup session middleware with persistent sessions in Redis
 * @param app NestExpressApplication
 */
export async function setupSession(app: NestExpressApplication) {
  const configService = app.get(ConfigService);

  // Redis connection logic
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
}

/**
 * Set up NestJs pipes
 *
 * @param app NestExpressApplication
 */
export function setupPipes(app: NestExpressApplication | INestApplication) {
  // Global param validator
  // - Transform param to the expected type as defined by TS
  // - Apply validation rules to our DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Delete any values from the body which does not have a decorator
      whitelist: true,
      // Customize the structure of the returned error messages
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            error: Object.values(error.constraints),
          })),
        );
      },
    }),
  );
}

/**
 * Set up the Handlebars view engine
 *
 * @param app NestExpressApplication
 */
export function setupHandlebars(app: NestExpressApplication) {
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  hbs.registerPartials(join(__dirname, '..', 'views/partials'));
  app.setViewEngine('hbs');
  app.set('view options', { layout: 'layouts/index' });
}

/**
 * JSON.stringify() doesn't know how to serialize a BigInt.
 * Monkey patch the BigInt serialization as per the MDN recommendation (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json)
 * The solution is described here: https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-1006088574
 */

export interface BigInt {
  /** Convert to BigInt to string form in JSON.stringify */
  toJSON: () => string;
}

// @ts-expect-error - Extending BigInt prototype to add JSON serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};
