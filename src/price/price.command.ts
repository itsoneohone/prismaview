import { Injectable, Logger } from '@nestjs/common';
import { Command, Option, Positional } from 'nestjs-command';
import { PriceService } from 'src/price/price.service';

@Injectable()
export class PriceCommand {
  private readonly logger = new Logger('PriceCommand');
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
    const startTs = new Date().getTime();
    this.logger.debug('[START] Fetch historical prices');
    this.logger.debug(`exchangeName: ${exchange}, market: ${market}`);
    await this.priceService.cmdFetchHistoricalPrices();
    const endTs = new Date().getTime();
    this.logger.log(
      `Fetched distinct traded markets in ${endTs - startTs} secs`,
    );
  }
}
