import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  version as ccxtVersion,
  exchanges as ccxtExchanges,
  kraken,
  bitstamp,
} from 'ccxt';
import { ConfigService } from '@nestjs/config';
import { sleep } from 'src/common/utils';
import { EMPTY, catchError, delay, expand, from, reduce, tap } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

@Injectable()
export class OrderService {
  private exchange: kraken;
  private bitstampExchange: bitstamp;
  private logger = new Logger(OrderService.name);
  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {
    this.exchange = new kraken({
      apiKey: this.config.getOrThrow('KRAKEN_API_KEY'),
      secret: this.config.getOrThrow('KRAKEN_SECRET'),
    });
    try {
      this.exchange.checkRequiredCredentials();
    } catch (err) {
      throw new ForbiddenException(err);
    }

    this.bitstampExchange = new bitstamp({
      apiKey: this.config.getOrThrow('BITSTAMP_API_KEY'),
      secret: this.config.getOrThrow('BITSTAMP_SECRET'),
    });
    try {
      const status = this.bitstampExchange.checkRequiredCredentials();
    } catch (err) {
      throw new ForbiddenException(err);
    }
  }

  _prepareAPIEndpoint(page) {
    return `https://swapi.dev/api/people?format=json&page=${page}`;
  }

  _hasMoreData(count: number, limit: number, offset: number) {
    return count > limit + offset;
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
        hasMore = this._hasMoreData(totalCount, limit, offset);
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

  async exchangeSupports() {
    const exchange = this.bitstampExchange;
    console.log({
      requiredCredentials: exchange.requiredCredentials,
      enableRateLimit: exchange.enableRateLimit,
      api: exchange.api.private,
    });
    const lookFor = 'order';
    return Object.keys(exchange.has).reduce((_supports, key) => {
      if (exchange.has[key]) {
        if ((lookFor && key.toLowerCase().includes(lookFor)) || !lookFor) {
          _supports[key] = exchange.has[key];
        }
      }
      return _supports;
    }, {});
  }

  async fetchKrakenOrders() {
    const start = new Date(2021, 1, 1).getTime() / 1000;
    const end = new Date(2021, 2, 1).getTime() / 1000;
    const since = undefined;
    console.log({
      startDate: new Date(start).toISOString(),
      start,
      endDate: new Date(end).toISOString(),
      end,
    });
    const symbol = undefined;
    const limit = undefined;
    const orders = await this.exchange.fetchClosedOrders(symbol, since, limit, {
      start,
      end,
    });

    const allOrders = orders.reduce((_orders, order) => {
      if (!_orders[order.status]) {
        _orders[order.status] = [];
      }
      _orders[order.status].push(order);

      return _orders;
    }, {});

    return {
      totalCount: this.exchange.last_json_response.result.count,
      count: orders.length,
      closedOrdersCount: allOrders['closed']?.length,
      closedOrders: allOrders['closed'],
      canceledOrdersCount: allOrders['canceled']?.length,
      cancelledOrders: allOrders['canceled'],
    };
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
    const orders = await this.bitstampExchange.privatePostUserTransactions({
      limit,
      sort: 'asc',
    });
    // const orders = await this.bitstampExchange.fetchMyTrades(
    //   symbol,
    //   start,
    //   limit,
    // );

    return { orders };
    // const allOrders = orders.reduce((_orders, order) => {
    //   if (!_orders[order.status]) {
    //     _orders[order.status] = [];
    //   }
    //   _orders[order.status].push(order);

    //   return _orders;
    // }, {});

    // return {
    //   totalCount: this.exchange.last_json_response.result.count,
    //   count: orders.length,
    //   closedOrdersCount: allOrders['closed']?.length,
    //   closedOrders: allOrders['closed'],
    //   canceledOrdersCount: allOrders['canceled']?.length,
    //   cancelledOrders: allOrders['canceled'],
    // };
  }
}
