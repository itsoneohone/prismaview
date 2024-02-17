import { Injectable, Logger } from '@nestjs/common';
import {
  version as ccxtVersion,
  exchanges as ccxtExchanges,
  bitstamp,
} from 'ccxt';
import { ConfigService } from '@nestjs/config';
import { sleep } from 'src/common/utils';
import {
  EMPTY,
  catchError,
  delay,
  expand,
  from,
  map,
  mergeMap,
  of,
  reduce,
  tap,
  zip,
} from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccessKey, ExchangeNameEnum } from '@prisma/client';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { KrakenExchange } from 'src/lib/exchange/kraken-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { CryptoExchange } from 'src/lib/exchange/types';
import { getCryptoExchange } from 'src/lib/exchange/common/utils';
import { searchHasMoreData } from 'src/common/search-utils';

@Injectable()
export class OrderPlaygroundService {
  private krakenExchange;
  private bitstampExchange;
  private logger = new Logger(OrderPlaygroundService.name);
  constructor(
    private config: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {
    const krakenDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('KRAKEN_API_KEY'),
      secret: this.config.getOrThrow('KRAKEN_SECRET'),
      exchange: ExchangeNameEnum.KRAKEN,
    };
    this.krakenExchange = ExchangeFactory.create(krakenDto) as KrakenExchange;

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

  _prepareAPIEndpoint(page) {
    return `https://swapi.dev/api/people?format=json&page=${page}`;
  }

  playground(accessKey: AccessKey) {
    const cryptoExchange: CryptoExchange = getCryptoExchange(accessKey);
    // cryptoExchange.exchange.fetchOHLCV()
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

  async isAccessLimited() {
    return this.krakenExchange.validateCredentialLimitations();
  }

  async exchangeSupports() {
    const lookFor = 'order';

    // const exchange = this.bitstampExchange;
    // console.log({
    //   requiredCredentials: exchange.requiredCredentials,
    //   enableRateLimit: exchange.enableRateLimit,
    //   api: exchange.api.private,
    // });

    // return Object.keys(exchange.has).reduce((_supports, key) => {
    //   if (exchange.has[key]) {
    //     if ((lookFor && key.toLowerCase().includes(lookFor)) || !lookFor) {
    //       _supports[key] = exchange.has[key];
    //     }
    //   }
    //   return _supports;
    // }, {});
  }

  async fetchKrakenOrders() {
    const start = new Date(2021, 1, 1).getTime();
    const end = new Date(2021, 2, 1).getTime();
    const since = undefined;
    console.log({
      startDate: new Date(start).toISOString(),
      start: start / 1000,
      endDate: new Date(end).toISOString(),
      end: end / 1000,
    });

    const symbol = undefined;
    const limit = undefined;

    // const orders = await this.bitstampExchange.privatePostUserTransactions({
    //   limit,
    //   offset,
    //   sort: 'asc',
    // });
    // const trades = await this.krakenExchange.exchange.fetchMyTrades(symbol, since, limit, {
    //   start: start / 1000,
    //   end: end / 1000,
    // });
    // const trades = await this.krakenExchange.exchange.privatePostTradesHistory({
    //   start: start / 1000,
    //   end: end / 1000,
    // });
    // return { trades };
    // https://docs.kraken.com/rest/#tag/Account-Data/operation/getClosedOrders
    const orders = await this.krakenExchange.exchange.fetchClosedOrders(
      symbol,
      since,
      limit,
      {
        // start: start / 1000,
        // end: end / 1000,
        trades: true,
        // ofs: 49,
        start: 'OI74LJ-5WDB3-ZFC7XT',
      },
    );

    // const orders = await this.krakenExchange.exchange.privatePostClosedOrders({
    //   start: start / 1000,
    //   end: end / 1000,
    //   trades: true,
    // });

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

  async fetchΒitstampOrders() {
    const start = new Date(2017, 1, 1).getTime() / 1000;
    const end = new Date(2021, 2, 1).getTime() / 1000;
    const since = undefined;
    console.log({
      startDate: new Date(start).toISOString(),
      start,
      endDate: new Date(end).toISOString(),
      end,
    });
    const symbol = undefined;
    const limit = 10;
    const offset = 1;
    // const orders = await this.bitstampExchange.privatePostUserTransactions({
    //   limit,
    //   offset,
    //   sort: 'asc',
    // });
    const orders = await this.bitstampExchange.exchange.fetchMyTrades(
      symbol,
      start,
      limit,
      {
        limit,
        sort: 'asc',
      },
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
}
