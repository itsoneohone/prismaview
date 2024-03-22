import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private logger = new Logger(SchedulerService.name);
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  fetchOHLV() {
    this.logger.debug('fetchOHLV() started.');
    this.logger.log('Pending implementation...');
    this.logger.debug('fetchOHLV() ended.');

    return;
  }
}
