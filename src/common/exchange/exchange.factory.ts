import { ExchangeNameEnum } from '@prisma/client';
import { BitstampExchange } from 'src/common/exchange/bitstamp-exchange';
import { GetExchangeDto } from 'src/common/exchange/dto';
import { KrakenExchange } from 'src/common/exchange/kraken-exchange';

const exchangeClasses = {
  [ExchangeNameEnum.KRAKEN]: KrakenExchange,
  [ExchangeNameEnum.BITSTAMP]: BitstampExchange,
};
export class ExchangeFactory {
  static create(exchangeData: GetExchangeDto) {
    const ExchangeClass = exchangeClasses[exchangeData.exchange];
    const exchange = new ExchangeClass(exchangeData.key, exchangeData.secret);

    switch (exchangeData.exchange) {
      case ExchangeNameEnum.KRAKEN:
        return exchange as KrakenExchange;
      case ExchangeNameEnum.BITSTAMP:
        return exchange as BitstampExchange;
    }
  }
}
