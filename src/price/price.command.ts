import { Injectable, Logger } from '@nestjs/common';
// import { Command, Option, Positional } from 'nestjs-command';
import { FetchDirection } from 'src/price/common/constants';
import { PriceService } from 'src/price/price.service';

/* @Injectable()
export class PriceCommand {
  private readonly logger = new Logger('PriceCommand');
  constructor(private priceService: PriceService) {}

  @Command({
    command: 'price:fetchPrices',
    describe: 'Fetch',
  })
  async fetchPrices(
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

    @Option({
      name: 'start',
      describe:
        'The datetime the command uses as a starting point. Depending on the direction defined the command will start fetching prices before or after the starting datetime.',
      type: 'string',
      required: false,
    })
    start: string,

    @Option({
      name: 'limit',
      describe:
        'The number of results to fetch (e.g. Bitstamp max 1000, Binance max 500, Kraken max 720)',
      type: 'number',
      required: false,
    })
    limit: number,

    @Option({
      name: 'direction',
      describe: 'Determines if prices are fetched',
      type: 'string',
      required: false,
      default: 'DESC',
    })
    direction: string,

    @Option({
      name: 'targetPages',
      describe: 'The number of pages to fetch',
      type: 'number',
      required: false,
    })
    targetPages: number,
  ) {
    const startTs = new Date().getTime();
    this.logger.debug('[START] Fetch historical prices');
    this.logger.log(
      `Args -- exchange: ${exchange}, market: ${market}, start: '${start}', limit: '${limit}', direction: '${direction}', targetPages: '${targetPages}'`,
    );

    let directionEnum;
    if (Object.keys(FetchDirection).indexOf(direction) === -1) {
      directionEnum = FetchDirection.DESC;
      this.logger.warn(
        `Invalid arg direction '${direction}', set to '${directionEnum}'`,
      );
    } else {
      directionEnum = FetchDirection[direction];
    }

    await this.priceService.cmdFetchPricesOfMarket(
      market,
      exchange,
      start,
      limit,
      directionEnum,
      targetPages,
    );
    // await this.priceService.cmdFetchPrices();
    const endTs = new Date().getTime();
    this.logger.debug(
      `[END] Fetched historical prices ('${(endTs - startTs) / 1000} secs')`,
    );
  }
}
 */
