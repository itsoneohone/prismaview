import { ForbiddenException } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { binance } from 'ccxt';
import {
  EMPTY,
  Observable,
  catchError,
  delay,
  expand,
  from,
  reduce,
  tap,
} from 'rxjs';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { BaseExchange } from 'src/lib/exchange/exchange.base';
import { FetchDirection } from '@/shared/constants/price';

export class BinanceExchange extends BaseExchange {
  declare public exchange: binance;
  declare public readonly rateLimit: number;
  declare public readonly fetchLimit: number;
  declare public readonly fetchDirection: FetchDirection;
  constructor(exchangeDto: GetExchangeDto) {
    super(exchangeDto);
    this.name = ExchangeNameEnum.BINANCE;
    // Respect the exchange's rate limits (https://binance-docs.github.io/apidocs/spot/en/#limits)
    this.rateLimit = 3000;
    this.fetchLimit = 500;
    this.fetchDirection = FetchDirection.ASC;
    this.exchange = new binance({
      apiKey: this.apiKey,
      secret: this.apiSecret,
      // Rate limit config
      enableRateLimit: true, // Enabled by default
      rateLimit: this.rateLimit,
    });

    // Enable debug mode to see the HTTP requests and responses in details
    // this.exchange.verbose = true;
  }

  /**
   * Send a sample request to ensure that the provided credentials are correct.
   */
  async validateCredentials() {
    try {
      const res = await this.exchange.fetchStatus();

      return true;
    } catch (err) {
      // A PermissionDenied will be thrown if websockets are not enabled on the API credentials
      if (['AuthenticationError', 'PermissionDenied'].includes(err.name)) {
        return false;
      }
      throw new ForbiddenException(err);
    }
  }

  /**
   * Ensure that the provided credentials do not have access to sensitive information.
   *
   * The `fetchBalance` fn should throw an error.
   */
  async validateCredentialLimitations() {
    try {
      // It should throw an error
      // Actually the most strict API key permission in Binance (read-only), allows reading the balance of the user.
      // @todo: Pick another fn that is not allowed with read-only permissions.
      const res = await this.exchange.fetchBalance();

      // These credentials should not be accepted
      return false;
    } catch (err) {
      if (err.name === 'PermissionDenied') {
        return true;
      }
      throw new Error(err);
    }
  }

  private _fetchClosedOrders(
    startDateObj: Date,
    endDateObj: Date,
    ofs: number,
  ) {
    throw new Error(`Implementation missing`);
  }

  /**
   * Sync the orders of a user with his exchange account
   */
  syncOrders(startDateObj: Date, endDateObj: Date): Observable<any> {
    throw new Error(`Implementation missing`);
  }
}
