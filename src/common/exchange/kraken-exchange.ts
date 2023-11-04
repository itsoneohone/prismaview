import { ForbiddenException } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { kraken } from 'ccxt';
import { BaseExchange } from 'src/common/exchange/exchange.base';

export class KrakenExchange extends BaseExchange {
  public exchange: kraken;
  constructor(key: string, secret: string) {
    super(key, secret);
    this.name = ExchangeNameEnum.KRAKEN;
    this.exchange = new kraken({
      apiKey: this.apiKey,
      secret: this.apiSecret,
    });
  }

  /**
   * Send a sample request to ensure that the provided credentials are correct.
   */
  async validateCredentials() {
    try {
      await this.exchange.privatePostGetWebSocketsToken();
      return true;
    } catch (err) {
      // A PermissionDenied will be thrown if websockets are not enabled on the API credentials
      if (err.name in ['AuthenticationError', 'PermissionDenied']) {
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
