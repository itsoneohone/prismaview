import { ForbiddenException } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { bitstamp } from 'ccxt';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { BaseExchange } from 'src/lib/exchange/exchange.base';

export class BitstampExchange extends BaseExchange {
  public exchange: bitstamp;
  constructor(exchangeDto: GetExchangeDto) {
    super(exchangeDto);
    this.name = ExchangeNameEnum.BITSTAMP;
    this.exchange = new bitstamp({
      apiKey: this.apiKey,
      secret: this.apiSecret,
    });
    // Respect the exchange's rate limits (https://docs.kraken.com/rest/#section/Rate-Limits)
    this.requestDelay = 1000;
  }

  async validateCredentials() {
    try {
      const res = await this.exchange.privatePostWebsocketsToken();
      return true;
    } catch (err) {
      if (err.name === 'AuthenticationError') {
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
      await this.exchange.fetchBalance();
      // These credentials should not be accepted
      return false;
    } catch (err) {
      if (err.name === 'PermissionDenied') {
        return true;
      }
      throw new Error(err);
    }
  }
}
