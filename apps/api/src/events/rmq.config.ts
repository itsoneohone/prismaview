import { RmqOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

/**
 * Creates RabbitMQ configuration options used for both microservice connection
 * and ClientProxy setup
 *
 * @param configService - NestJS ConfigService instance for accessing environment variables
 * @returns RmqOptions object configured with RabbitMQ connection settings
 */
export const getRmqOptions = (configService: ConfigService): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [configService.get<string>('RABBITMQ_URL')],
    queue: configService.get<string>('RABBITMQ_EVENTS_QUEUE'),
    queueOptions: {
      durable: true,
    },
    wildcards: true,
  },
});
