import { Injectable, Logger } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { Command, Option, Positional } from 'nestjs-command';
import { PriceService } from 'src/price/price.service';

@Injectable()
export class PriceCommand {
  constructor(private priceService: PriceService) {}

  @Command({
    command: 'price:fetchHistoricalPrices',
    describe: 'Fetch',
  })
  async fetchHistoricalPrices(
    @Option({
      name: 'exchange',
      describe: 'The name of the exchange',
      type: 'string',
      required: false,
    })
    exchange: string,

    @Option({
      name: 'market',
      describe: 'The market - e.g. BTC/USD',
      type: 'string',
      required: false,
    })
    market: string,
  ) {
    console.debug('Start fetcing historical prices');
    console.debug(`exchangeName: ${exchange}, market: ${market}`);
    await this.priceService.cmdFetchHistoricalPrices();
  }
}
