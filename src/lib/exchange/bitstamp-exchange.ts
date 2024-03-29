import { ForbiddenException } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { bitstamp } from 'ccxt';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { BaseExchange } from 'src/lib/exchange/exchange.base';

export class BitstampExchange extends BaseExchange {
  public declare exchange: bitstamp;
  constructor(exchangeDto: GetExchangeDto) {
    super(exchangeDto);
    this.name = ExchangeNameEnum.BITSTAMP;
    // Respect the exchange's rate limits - @todo check the bitstamp rateLimits
    this.rateLimit = 1000;
    this.exchange = new bitstamp({
      apiKey: this.apiKey,
      secret: this.apiSecret,
      // Rate limit config
      enableRateLimit: true, // Enabled by default
      rateLimit: this.rateLimit,
    });
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
