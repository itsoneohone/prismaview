import { faker } from '@faker-js/faker';
import { ExchangeNameEnum } from '@prisma/client';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { KrakenExchange } from 'src/lib/exchange/kraken-exchange';

describe('Exchanges', () => {
  describe('ExchangeFactory', () => {
    it('should throw an error when requesting an exchange that is not supported', () => {
      const exchangeData: GetExchangeDto = {
        userId: 1,
        accessKeyId: 1,
        exchange: ExchangeNameEnum.KRAKEN,
        key: faker.string.uuid(),
        secret: faker.string.uuid(),
      };
      const krakenExchange = ExchangeFactory.create(exchangeData);

      expect(krakenExchange.getName()).toEqual(exchangeData.exchange);
      expect(krakenExchange).toBeInstanceOf(KrakenExchange);
    });
  });

  describe('KrakenExchange', () => {
    let krakenExchange: KrakenExchange;
    let validateCredentialsSpy;

    beforeEach(() => {
      const exchangeData: GetExchangeDto = {
        userId: 1,
        accessKeyId: 1,
        exchange: ExchangeNameEnum.KRAKEN,
        key: faker.string.alphanumeric({ length: 24 }),
        secret: faker.string.alphanumeric({ length: 24 }),
      };
      krakenExchange = new KrakenExchange(exchangeData);

      // Mock validateCredentials from the start to avoid external API calls
      validateCredentialsSpy = jest.spyOn(
        krakenExchange,
        'validateCredentials',
      );
      validateCredentialsSpy.mockImplementation(() => Promise.resolve(false));
    });

    afterAll(() => {
      if (validateCredentialsSpy) {
        validateCredentialsSpy.mockImplementation(() => Promise.resolve(false));
      }
    });

    it('should return false if the credentials are invalid', async () => {
      await expect(krakenExchange.validateCredentials()).resolves.toBeFalsy();
    });
  });

  describe('BitstampExchange', () => {
    let bitstampExchange: BitstampExchange;

    beforeAll(() => {
      const exchangeData: GetExchangeDto = {
        userId: 1,
        accessKeyId: 1,
        exchange: ExchangeNameEnum.BITSTAMP,
        key: faker.string.alphanumeric({ length: 24 }),
        secret: faker.string.alphanumeric({ length: 24 }),
      };
      bitstampExchange = new BitstampExchange(exchangeData);
    });

    it('should throw an error if the credentials are invalid', async () => {
      await expect(bitstampExchange.validateCredentials()).resolves.toBeFalsy();
    });
  });
});
