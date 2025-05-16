import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PriceService } from 'src/price/price.service';

@Injectable()
export class PriceSchedulerService {
  private logger = new Logger(PriceSchedulerService.name);
  constructor(private priceService: PriceService) {}

  // @Cron(CronExpression.EVERY_30_SECONDS)
  fetchOhlcv() {
    this.logger.debug('Fetching OHLCV in the price scheduling service');
  }
}
