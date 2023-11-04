export class BaseExchange {
  protected name: string;
  // Limit the requests to the exchange - e.g. If set to 2000ms, it will allow one request every 2 secs.
  protected rateLimitProtection = 2000;
  public exchange;
  readonly apiKey: string;
  readonly apiSecret: string;

  constructor(key: string, secret: string) {
    this.apiKey = key;
    this.apiSecret = secret;
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
        if (lookFor && key.toLowerCase().includes(lookFor)) {
          _supports[key] = exchange.has[key];
        }
      }
      return _supports;
    }, {});
  }

  syncOrders() {
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
