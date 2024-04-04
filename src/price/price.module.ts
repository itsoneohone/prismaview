import { Module } from '@nestjs/common';
import { PriceSchedulerService } from 'src/price/price.scheduler.service';
import { PriceService } from 'src/price/price.service';

@Module({
  providers: [PriceService, PriceSchedulerService],
  exports: [PriceService],
})
export class PriceModule {}
