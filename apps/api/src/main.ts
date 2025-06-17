import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupPipes, setupHandlebars, setupMorgan } from '@app/app.config';
import {
  MicroserviceOptions,
  RmqEvents,
  RmqStatus,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { getRmqOptions } from '@events/rmq.config';

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

  // Get config service
  const configService = app.get(ConfigService);
  const logger = new Logger('Main application');

  // Set up the session middleware
  // await setupSession(app);

  // Set up HTTP request logging
  setupMorgan(app);

  // Set up pipes
  setupPipes(app);

  // Set up the Handlebars view engine
  setupHandlebars(app);

  // Connect to RabbitMQ events queue
  const rmqUrl = configService.get<string>('RABBITMQ_URL');
  const rmqServer = app.connectMicroservice<MicroserviceOptions>(
    getRmqOptions(configService),
  );
  rmqServer.status.subscribe((status: RmqStatus) => {
    logger.log(`RabbitMQ microservice at "${rmqUrl}" is now "${status}"`);
  });
  rmqServer.on<RmqEvents>('error', (err) => {
    logger.error(err);
  });

  // Start all microservices
  await app.startAllMicroservices();

  // Start the HTTP server
  await app.listen(configService.get('APP_PORT'));
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
