import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prismaModule/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerService {
  private logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // @Cron(CronExpression.EVERY_10_MINUTES)
  async example() {
    this.logger.debug('Cron job example');
  }
}
