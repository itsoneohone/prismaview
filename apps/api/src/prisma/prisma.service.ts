import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { ENABLE_DB_LOGGING } from 'src/app-config/app-config';
import { LogDefinition } from 'src/prisma/types';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private logger = new Logger(PrismaService.name);
  constructor(config: ConfigService) {
    const loggingConfig: Array<LogDefinition> = ENABLE_DB_LOGGING
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
      // errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    if (ENABLE_DB_LOGGING) {
      (this.$on as any)('query', async (e: Prisma.QueryEvent) => {
        this.logger.debug('$on.query');
        this.logger.log(`Query: ${e.query}`);
        this.logger.log('Params: ' + e.params);
        this.logger.log('Duration: ' + e.duration + 'ms');

        this.logger.debug('---');
      });
    }
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    (this.$on as any)('beforeExit', async () => {
      await app.close();
    });
  }

  // Clean the test DB
  cleanDB() {
    return this.$transaction([
      this.user.deleteMany(),
      this.userSetting.deleteMany(),
      this.accessKey.deleteMany(),
      this.order.deleteMany(),
    ]);
  }
}
