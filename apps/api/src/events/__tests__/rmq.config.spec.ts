import { Test, TestingModule } from '@nestjs/testing';
import { getRmqOptions } from '@events/rmq.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

describe('getRmqOptions', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should set the correct RMQ options', () => {
    expect(getRmqOptions(configService)).toEqual({
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
  });
});
