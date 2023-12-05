import { ExchangeNameEnum } from '@prisma/client';
import { BitstampExchange } from 'src/common/exchange/bitstamp-exchange';
import { GetExchangeDto } from 'src/common/exchange/dto';
import { KrakenExchange } from 'src/common/exchange/kraken-exchange';

const exchangeClasses = {
  [ExchangeNameEnum.KRAKEN]: KrakenExchange,
  [ExchangeNameEnum.BITSTAMP]: BitstampExchange,
};
export class ExchangeFactory {
  static create(exchangeDto: GetExchangeDto) {
    const ExchangeClass = exchangeClasses[exchangeDto.exchange];
    const exchange = new ExchangeClass(exchangeDto);

    switch (exchangeDto.exchange) {
      case ExchangeNameEnum.KRAKEN:
        return exchange as KrakenExchange;
      case ExchangeNameEnum.BITSTAMP:
        return exchange as BitstampExchange;
    }
  }
}
