import { Injectable, Logger } from '@nestjs/common';
import {
  version as ccxtVersion,
  exchanges as ccxtExchanges,
  kraken,
} from 'ccxt';
import { ConfigService } from '@nestjs/config';
import { sleep } from 'src/common/utils';

@Injectable()
export class OrderService {
  private exchange: kraken;
  private logger = new Logger(OrderService.name);
  constructor(private config: ConfigService) {
    this.exchange = new kraken({
      apiKey: this.config.getOrThrow('KRAKEN_API_KEY'),
      secret: this.config.getOrThrow('KRAKEN_SECRET'),
    });
    this.exchange.checkRequiredCredentials();
  }

  _prepareAPIEndpoint(page) {
    return `https://swapi.dev/api/people?format=json&page=${page}`;
  }

  _hasMoreData(count: number, limit: number, offset: number) {
    return count > limit + offset;
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
    console.log({
      requiredCredentials: this.exchange.requiredCredentials,
      enableRateLimit: this.exchange.enableRateLimit,
      api: this.exchange.api.private,
    });
    return Object.keys(this.exchange.has).reduce((_supports, key) => {
      if (this.exchange.has[key]) {
        _supports[key] = this.exchange.has[key];
      }
      return _supports;
    }, {});
  }

  async fetchOrders() {
    const startDate = new Date(2021, 1, 1);
    const start = this.exchange.parse8601(startDate.toISOString()) / 1000;
    const startJs = startDate.getTime();
    const endDate = new Date(2021, 2, 1);
    const end = this.exchange.parse8601(endDate.toISOString()) / 1000;
    const endJs = endDate.getTime();
    const since = undefined;
    console.log({
      startDate: startDate.toISOString(),
      start,
      startJs,
      endDate: endDate.toISOString(),
      end,
      endJs,
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
}
