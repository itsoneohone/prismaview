import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { ENABLE_LOGGING } from 'src/app-config/app-config';
import { LogDefinition } from '@prisma/client/runtime/library';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private logger = new Logger(PrismaService.name);
  constructor(config: ConfigService) {
    const loggingConfig: Array<LogDefinition> = ENABLE_LOGGING
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : [];

    super({
      datasources: {
        db: {
          url: config.getOrThrow('DATABASE_URL'),
        },
      },
      log: [...loggingConfig],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    if (ENABLE_LOGGING) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.$on('query', async (e) => {
        this.logger.debug('$on.query');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.logger.log(`Query: ${e.query}`);
        // @ts-ignore
        this.logger.log('Params: ' + e.params);
        // @ts-ignore
        this.logger.log('Duration: ' + e.duration + 'ms');

        this.logger.debug('---');
      });
    }
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // @ts-ignore
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  // Clean the test DB
  cleanDB() {
    return this.$transaction([
      this.user.deleteMany(),
      this.expense.deleteMany(),
      this.accessKey.deleteMany(),
      this.order.deleteMany(),
    ]);
  }
}
