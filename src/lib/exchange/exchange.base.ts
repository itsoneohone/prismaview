import { Logger } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { Observable } from 'rxjs';
import { GetExchangeDto } from 'src/lib/exchange/dto';

export enum SyncMode {
  ALL = 'ALL',
  RECENT = 'RECENT',
  RANGE = 'RANGE',
}

export class BaseExchange {
  protected logger;
  protected name: ExchangeNameEnum;
  // Limit the requests to the exchange - e.g. If set to 2000ms, it will allow one request every 2 secs.
  protected accessKeyId: number;
  // Read more on rateLimit here: https://github.com/ccxt/ccxt/wiki/Manual#rate-limit
  protected rateLimit = 2000;
  public exchange;
  readonly userId: number;
  readonly apiKey: string;
  readonly apiSecret: string;

  constructor(exchangeDto: GetExchangeDto) {
    const { userId, accessKeyId, key, secret } = exchangeDto;
    this.userId = userId;
    this.accessKeyId = accessKeyId;
    this.apiKey = key;
    this.apiSecret = secret;

    // Set up the logger
    this.logger = new Logger(this.name);
  }

  getName() {
    return this.name;
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

  syncOrders(startDateObj: Date, endDateObj: Date): Observable<any> {
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
