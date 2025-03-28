import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { version as ccxtVersion } from 'ccxt';
import { ConfigService } from '@nestjs/config';
import { sleep } from '@/shared/utils/time';
import { EMPTY, catchError, delay, expand, reduce, tap } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExchangeNameEnum } from '@prisma/client';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { KrakenExchange } from 'src/lib/exchange/kraken-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { CryptoExchange } from 'src/lib/exchange/types';
import { searchHasMoreData } from 'src/shared/utils/search';
import { BinanceExchange } from 'src/lib/exchange/binance-exchange';
import { PriceService } from 'src/price/price.service';

@Injectable()
export class PlaygroundService {
  private krakenExchange;
  private bitstampExchange;
  private binanceExchange;
  private logger = new Logger(PlaygroundService.name);
  constructor(
    private config: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
    private priceService: PriceService,
  ) {
    const krakenDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('KRAKEN_API_KEY'),
      secret: this.config.getOrThrow('KRAKEN_SECRET'),
      exchange: ExchangeNameEnum.KRAKEN,
    };
    this.krakenExchange = ExchangeFactory.create(krakenDto) as KrakenExchange;

    const binanceDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('BINANCE_API_KEY'),
      secret: this.config.getOrThrow('BINANCE_SECRET'),
      exchange: ExchangeNameEnum.BINANCE,
    };
    this.binanceExchange = ExchangeFactory.create(
      binanceDto,
    ) as BinanceExchange;

    const bitstampDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('BITSTAMP_API_KEY'),
      secret: this.config.getOrThrow('BITSTAMP_SECRET'),
      exchange: ExchangeNameEnum.BITSTAMP,
    };
    this.bitstampExchange = ExchangeFactory.create(
      bitstampDto,
    ) as BitstampExchange;
  }

  _getCryptoExchange(exchangeName: ExchangeNameEnum) {
    const exchangeMapping = {
      [ExchangeNameEnum.BINANCE]: this.binanceExchange,
      [ExchangeNameEnum.BITSTAMP]: this.bitstampExchange,
      [ExchangeNameEnum.KRAKEN]: this.krakenExchange,
    };

    return exchangeMapping[exchangeName];
  }

  _prepareAPIEndpoint(page) {
    return `https://swapi.dev/api/people?format=json&page=${page}`;
  }

  async ccxtInfo() {
    return {
      version: ccxtVersion,
    };
  }

  async paginate() {
    const limit = 10;
    const people = [];
    let totalCount: number;
    let offset = 0;
    let page = 1;
    let hasMore = false;

    this.logger.debug('[START] Fetch StarWars characters');
    do {
      try {
        this.logger.log(
          `Fetching page ${page} - offset: ${offset}, limit: ${limit}`,
        );
        const resp = await fetch(this._prepareAPIEndpoint(page));
        const { count, results } = await resp.json();

        if (!totalCount) {
          totalCount = count;
          this.logger.log(
            `There are ${totalCount} StarWars characters to be received`,
          );
        }

        results.forEach((person) => {
          // destructure the person object and add to array
          const { name, height, films } = person;
          this.logger.log(`- ${name} arrived`);
          people.push({ name, height, films });
        });
        // increment the page with 1 on each loop
        hasMore = searchHasMoreData(totalCount, limit, offset);
        page++;
        offset += limit;
        this.logger.log(
          `Resting for half a sec... Is there more to fetch? ${hasMore}`,
        );
        sleep(500);
      } catch (err) {
        this.logger.error(`Oops, something went wrong (${err})`);
      }
    } while (hasMore);
    this.logger.debug('[END] Fetch StarWars characters');
    return { totalCount, people };
  }

  paginate2() {
    const limit = 10;
    const people = [];
    let totalCount: number;
    let offset = 0;
    let page = 1;
    let hasMore = false;

    this.logger.debug('[START] Fetch StarWars characters');

    const paginationObs = this.httpService
      .get(this._prepareAPIEndpoint(page))
      .pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw `An error occurred (${error.response.data})`;
        }),
        tap(() => console.log(`  - Fetched page ${page}`)),
        tap(() => console.log(`  About to sleep for 60`)),
        delay(600000),
        tap(() => console.log(`  Slept for 60`)),
        expand((res) => {
          if (res.data.next && page < 3) {
            page += 1;
            return this.httpService.get(res.data.next).pipe(
              catchError((error: AxiosError) => {
                this.logger.error(error.response.data);
                throw `An error occurred (${error.response.data})`;
              }),
              tap(() => console.log(`  - Fetched page ${page}`)),
              delay(10),
              tap(() => console.log(' - Waited for 10ms')),
            );
          }
          return EMPTY;
        }),
        tap(() => console.log(`    * Processing page ${page}`)),
        reduce((acc, current) => {
          const { results } = current.data;

          return acc.concat(results);
        }, []),
      );

    return paginationObs;
  }

  async validateCredentials(exchangeName: ExchangeNameEnum) {
    const cryptoExchange = this._getCryptoExchange(
      exchangeName,
    ) as CryptoExchange;
    const [validateCredentials, validateCredentialLimitations] =
      await Promise.all([
        cryptoExchange.validateCredentials(),
        cryptoExchange.validateCredentialLimitations(),
      ]);

    return { validateCredentials, validateCredentialLimitations };
  }

  async exchangeSupports(cryptoExchangeName: string, lookFor?: string) {
    if (!cryptoExchangeName) {
      throw new BadRequestException({
        field: 'cryptoExchangeName',
        error: `cryptoExchangeName has to be one of (${Object.keys(ExchangeNameEnum).join(', ')})`,
      });
    }

    const cryptoExchange =
      cryptoExchangeName === ExchangeNameEnum.KRAKEN
        ? this.krakenExchange
        : this.bitstampExchange;
    const exchange = cryptoExchange.exchange;

    return {
      timeout: exchange.timeout,
      rateLimit: exchange.rateLimit,
      exchangeName: cryptoExchange.name,
      has: cryptoExchange.supports(lookFor),
    };
  }

  async loadMarkets(exchangeName: ExchangeNameEnum) {
    const cryptoExchange: CryptoExchange = exchangeName
      ? this._getCryptoExchange(exchangeName)
      : this.krakenExchange;
    return cryptoExchange.loadMarkets();
  }

  async fetchKrakenLedger(exchangeName: ExchangeNameEnum) {
    // const start = new Date(2023, 12, 1).getTime();
    // https://docs.ccxt.com/#/README?id=ledger
    const cryptoExchange: CryptoExchange =
      this._getCryptoExchange(exchangeName);
    const exchange = cryptoExchange.exchange;
    const code = 'USDT';
    const since = undefined;
    const limit = undefined;
    const ledger = await exchange.fetchLedger(
      code,
      since,
      limit,
      //   {
      //   start: new Date(2023, 11, 1).getTime() / 1000,
      //   end: new Date(2024, 1, 1).getTime() / 1000,
      //   ofs: 50,
      // }
    );

    return { ledger };
  }

  async fetchKrakenOrders() {
    const cryptoExchange: CryptoExchange = this.krakenExchange;
    const exchange = cryptoExchange.exchange;
    const start = new Date(2023, 10, 1).getTime();
    const end = new Date(2023, 11, 31).getTime();
    const since = new Date(2023, 5, 1);
    // const since = undefined;
    console.log({
      since,
      sinceTs: since.getTime(),
      startDate: new Date(start).toISOString(),
      start: start / 1000,
      endDate: new Date(end).toISOString(),
      end: end / 1000,
    });

    const symbol = undefined;
    const limit = undefined;

    // https://docs.kraken.com/rest/#tag/Account-Data/operation/getClosedOrders
    await cryptoExchange.loadMarkets();
    const orders = await exchange.fetchClosedOrders(
      symbol,
      since.getTime(),
      limit,
      {
        start: since.getTime() / 1000,
        end: start / 1000,
        // trades: true,
        // ofs: 49,
        // start: 'OI74LJ-5WDB3-ZFC7XT',
      },
    );

    return { orders };
  }

  async fetchKrakenOrder(orderId: string) {
    // const start = new Date(2023, 12, 1).getTime();
    // https://docs.ccxt.com/#/README?id=querying-orders
    const cryptoExchange: CryptoExchange = this.krakenExchange;
    const exchange = cryptoExchange.exchange;
    const order = await exchange.fetchOrder(orderId);

    return { order };
  }

  async fetchOrders(exchangeName: ExchangeNameEnum) {
    const cryptoExchange: CryptoExchange =
      this._getCryptoExchange(exchangeName);
    const exchange = cryptoExchange.exchange;

    const start = new Date(2017, 1, 1).getTime() / 1000;
    const end = new Date(2021, 2, 1).getTime() / 1000;
    const since = undefined;
    console.log({
      startDate: new Date(start).toISOString(),
      start,
      endDate: new Date(end).toISOString(),
      end,
    });
    const symbol = 'BTC/USDT';
    const limit = 10;
    const offset = 1;
    // const orders = await this.bitstampExchange.privatePostUserTransactions({
    //   limit,
    //   offset,
    //   sort: 'asc',
    // });

    const orders = await exchange.fetchClosedOrders(
      symbol,
      start,
      limit,
      // {
      //   limit,
      //   sort: 'asc',
      // },
    );

    return { orders };
    // const allOrders = orders.reduce((_orders, order) => {
    //   if (!_orders[order.status]) {
    //     _orders[order.status] = [];
    //   }
    //   _orders[order.status].push(order);

    //   return _orders;
    // }, {});

    // return {
    //   totalCount: this.krakenExchange.exchange.last_json_response.result.count,
    //   count: orders.length,
    //   closedOrdersCount: allOrders['closed']?.length,
    //   closedOrders: allOrders['closed'],
    //   canceledOrdersCount: allOrders['canceled']?.length,
    //   cancelledOrders: allOrders['canceled'],
    // };
  }

  async fetchTicker(exchangeName: ExchangeNameEnum, market: string) {
    const cryptoExchange: CryptoExchange = exchangeName
      ? this._getCryptoExchange(exchangeName)
      : this.krakenExchange;
    const exchange = cryptoExchange.exchange;

    await exchange.loadMarkets();

    if (!exchange.markets[market]) {
      throw new BadRequestException(
        `${cryptoExchange.getName()} does not support market '${market}'`,
      );
    }

    return exchange.fetchTicker(market);
  }

  async fetchOhlcv(
    exchangeName: ExchangeNameEnum,
    market: string,
    sinceDateString: string,
    limit?: number,
  ) {
    return this.priceService.fetchOhlcv(exchangeName, market, {
      startDateString: sinceDateString,
      limit,
    });
  }
}
