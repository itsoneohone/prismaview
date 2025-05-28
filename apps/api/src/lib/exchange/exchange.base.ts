import { Logger } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { Observable } from 'rxjs';
import { GetExchangeDto } from '@lib/exchange/dto';
import { FetchDirection } from '@shared/constants/price';

export enum SyncMode {
  ALL = 'ALL',
  RECENT = 'RECENT',
  RANGE = 'RANGE',
}

export class BaseExchange {
  protected logger = new Logger(BaseExchange.name);
  protected name: ExchangeNameEnum;
  // Limit the requests to the exchange - e.g. If set to 2000ms, it will allow one request every 2 secs.
  protected accessKeyId: number;
  // Read more on rateLimit here: https://github.com/ccxt/ccxt/wiki/Manual#rate-limit
  public readonly rateLimit: number = 2000;
  public readonly exchange;
  public readonly fetchLimit: number = 500;
  public readonly fetchDirection: FetchDirection = FetchDirection.ASC;
  protected readonly userId: number;
  protected readonly apiKey: string;
  protected readonly apiSecret: string;

  constructor(exchangeDto: GetExchangeDto) {
    const { userId, accessKeyId, key, secret } = exchangeDto;
    this.userId = userId;
    this.accessKeyId = accessKeyId;
    this.apiKey = key;
    this.apiSecret = secret;
  }

  getName() {
    return this.name;
  }

  async loadMarkets() {
    if (this.exchange.markets?.length) {
      return this.exchange.markets;
    }
    try {
      const markets = await this.exchange.loadMarkets();
      return markets;
    } catch (error) {
      return {
        exception: error.name,
        description: error.toString(),
      };
    }
  }

  supports(lookFor?: string) {
    const exchange = this.exchange;

    if (!lookFor) {
      return exchange.has;
    }

    return Object.keys(exchange.has).reduce((_supports, key) => {
      if (exchange.has[key]) {
        if (
          (lookFor && key.toLowerCase().includes(lookFor.toLowerCase())) ||
          !lookFor
        ) {
          _supports[key] = exchange.has[key];
        }
      }
      return _supports;
    }, {});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  syncOrders(_startDateObj: Date, _endDateObj: Date): Observable<any> {
    throw new Error('The child class must implement the fn "syncOrders()",');
  }

  validateCredentials() {
    throw new Error(
      'The child class must implement the fn "validateCredentials()",',
    );
  }

  validateCredentialLimitations() {
    throw new Error(
      'The child class must implement the fn "validateCredentialLimitations()",',
    );
  }
}
