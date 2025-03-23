import { Logger } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import {
  Command,
  CommandRunner,
  InquirerService,
  Option,
} from 'nest-commander';
import { parseDate } from 'src/common/utils';
import { isSupportedExchange } from 'src/lib/exchange/common/utils';

import { FetchDirection } from 'src/price/common/constants';
import { QUESTIONS_START } from 'src/commands/inquirer/price.inquirer.start';
import { QUESTIONS_EXCHANGE } from 'src/commands/inquirer/price.inquirer.exchange';
import { QUESTIONS_TASK } from 'src/commands/inquirer/price.inquirer.task';
import { PriceService } from 'src/price/price.service';

@Command({
  name: 'prices-handler',
  arguments: '[task]',
  options: { isDefault: true },
})
export class PriceCommand extends CommandRunner {
  private readonly logger = new Logger('PriceCommand');
  constructor(
    private priceService: PriceService,
    private readonly inquirer: InquirerService,
  ) {
    super();
  }

  @Option({
    flags: '-e, --exchange [string]',
    description: 'The name of the exchange',
  })
  parseExchange(val: string): string {
    return val;
  }

  @Option({
    flags: '-m, --market [string]',
    description: 'The market - e.g. BTC/USD',
  })
  parseMarket(val: string): string {
    return val;
  }

  @Option({
    flags: '-s, --start [string]',
    description:
      'The datetime the command uses as a starting point. Depending on the chosen direction the command will start fetching prices before or after the starting datetime. Enter the date in any valid date string format (e.g., yyyy/mm/dd).',
  })
  parseStartDate(val: string): string {
    return val;
  }

  @Option({
    flags: '-d, --direction [string]',
    description:
      'Determines the fetch direction (e.g., ASC, DESC). The default value is DESC',
    defaultValue: FetchDirection.DESC,
  })
  parseDirection(val: string): string {
    return val;
  }

  @Option({
    flags: '-l, --limit [number]',
    description:
      'The number of results to fetch. If no limit is provided, it will be used the default fetch limit of the selected exchange (e.g. Bitstamp max 1000, Binance max 500, Kraken max 720)',
  })
  parseLimit(val: string): number {
    return Number(val);
  }

  @Option({
    flags: '-tp, --targetPages [number]',
    description:
      'The number of pages to fetch. If no target pages is provided the script will continue fetching prices until no new results are fetched.',
  })
  parseTargetPages(val: string): number {
    return Number(val);
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    try {
      this.logger.log(inputs);
      this.logger.log(options);

      let task = inputs[0];
      let { exchange, market, start, limit, direction, targetPages } = options;

      if (!task) {
        task = (
          await this.inquirer.ask<{ task: string }>(QUESTIONS_TASK, undefined)
        ).task;
      }

      if (!isSupportedExchange(exchange)) {
        exchange = (
          await this.inquirer.ask<{ exchange: string }>(
            QUESTIONS_EXCHANGE,
            undefined,
          )
        ).exchange;
      }

      if (!parseDate(start)) {
        start = (
          await this.inquirer.ask<{ start: string }>(QUESTIONS_START, undefined)
        ).start;
      }

      const startTs = new Date().getTime();
      this.logger.debug('[START] Fetch historical prices');
      this.logger.log(
        `Args -- exchange: '${exchange}', market: '${market}', start: '${start}', limit: '${limit}', direction: '${direction}', targetPages: '${targetPages}'`,
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
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }
}
