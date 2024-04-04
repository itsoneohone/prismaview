import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeNameEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BinanceExchange } from 'src/lib/exchange/binance-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { CryptoExchange } from 'src/lib/exchange/types';
import { getTickerSymbols } from 'src/order/common/utils';
import { CreatePriceDto } from 'src/price/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PriceService {
  private bitstampExchange;
  private binanceExchange;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const binanceDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('BINANCE_API_KEY'),
      secret: this.config.getOrThrow('BINANCE_SECRET'),
      exchange: ExchangeNameEnum.BINANCE,
    };
    this.binanceExchange = ExchangeFactory.create(
      binanceDto,
    ) as BinanceExchange;

    const bitstampDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('BITSTAMP_API_KEY'),
      secret: this.config.getOrThrow('BITSTAMP_SECRET'),
      exchange: ExchangeNameEnum.BITSTAMP,
    };
    this.bitstampExchange = ExchangeFactory.create(
      bitstampDto,
    ) as BitstampExchange;
  }

  private _getCryptoExchange(exchangeName: ExchangeNameEnum) {
    const exchangeMapping = {
      [ExchangeNameEnum.BINANCE]: this.binanceExchange,
      [ExchangeNameEnum.BITSTAMP]: this.bitstampExchange,
    };

    return exchangeMapping[exchangeName];
  }

  /**
   * Update the CreatePriceDto by setting the currency values and datetime.
   *
   * @param dto CreatePriceDto
   * @returns dto
   */
  private _prepareCreatePriceDto(dto: CreatePriceDto) {
    const { base, quote } = getTickerSymbols(dto.symbol);
    return {
      ...dto,
      base,
      quote,
      // Get the unix timestamp based on the input date
      datetime: new Date(dto.timestamp.toString()),
    };
  }

  /**
   * Create a historical price entry (ohlcv)
   * @param dto
   */
  async createPrice(dto: CreatePriceDto) {
    this.prisma.price.create({
      data: {
        ...this._prepareCreatePriceDto(dto),
      },
    });
  }

  async fetchOhlcv(
    exchangeName: ExchangeNameEnum,
    market: string,
    sinceDateString: string,
    limit?: number,
  ) {
    // Check if the date is valid
    let since = new Date(sinceDateString).getTime();
    if (isNaN(since)) {
      since = undefined;
    }

    console.log({
      since,
      sinceDt: since ? new Date(since).toISOString() : undefined,
    });
    const cryptoExchange: CryptoExchange =
      this._getCryptoExchange(exchangeName);
    const exchange = cryptoExchange.exchange;
    await exchange.loadMarkets();

    if (!exchange.markets[market]) {
      throw new BadRequestException({
        field: 'market',
        error: `${this.binanceExchange.name} does not support the '${market}' market.`,
      });
    }

    console.log({ market, sinceDateString, since, limit });

    const ohlcv = await exchange.fetchOHLCV(market, '1m', since, limit);

    const { base, quote } = getTickerSymbols(market);
    const priceDtos: Array<CreatePriceDto> = ohlcv.map((item) => {
      const [timestamp, open, high, low, close, volume] = item;
      const priceDto: CreatePriceDto = {
        symbol: market,
        base,
        quote,
        open: new Decimal(open),
        high: new Decimal(high),
        low: new Decimal(low),
        close: new Decimal(close),
        volume: new Decimal(volume),
        timestamp: BigInt(timestamp),
        datetime: new Date(timestamp),
        exchange: cryptoExchange.getName(),
      };

      return priceDto;
    });

    const response = await this.prisma.price.createMany({
      data: priceDtos,
      skipDuplicates: true,
    });

    return response;
  }

  async fetchHistoricalPrices() {}
}
