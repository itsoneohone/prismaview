import { ForbiddenException } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { bitstamp } from 'ccxt';
import { BaseExchange } from 'src/common/exchange/exchange.base';

export class BitstampExchange extends BaseExchange {
  public exchange: bitstamp;
  constructor(key: string, secret: string) {
    super(key, secret);
    this.name = ExchangeNameEnum.BITSTAMP;
    this.exchange = new bitstamp({
      apiKey: this.apiKey,
      secret: this.apiSecret,
    });
  }

  async validateCredentials() {
    try {
      await this.exchange.privatePostWebsocketsToken();
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
      console.log('BEFORE FETCHING BALANCE');
      await this.exchange.fetchBalance();
      console.log('AFTER FETCHING BALANCE');
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
