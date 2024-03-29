import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { getTickerSymbols } from 'src/order/common/utils';
import { FiatCurrency, TickerSymbol } from 'src/lib/common/constants';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { ConfigService } from '@nestjs/config';
import { ExchangeNameEnum } from '@prisma/client';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { KrakenExchange } from 'src/lib/exchange/kraken-exchange';
import { isFiat } from 'src/lib/common/utils';
import { BinanceExchange } from 'src/lib/exchange/binance-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { CryptoExchange } from 'src/lib/exchange/types';

@Injectable()
export class SchedulerService {
  private logger = new Logger(SchedulerService.name);
  private binanceExchange;
  private bitstampExchange;
  private krakenExchange;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const krakenDto: GetExchangeDto = {
      userId: 1,
      accessKeyId: 1,
      key: this.config.getOrThrow('KRAKEN_API_KEY'),
      secret: this.config.getOrThrow('KRAKEN_SECRET'),
      exchange: ExchangeNameEnum.KRAKEN,
    };
    this.krakenExchange = ExchangeFactory.create(krakenDto) as KrakenExchange;

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

  /**
   * Query all user orders and get the distinct traded markets
   *
   * @returns
   */
  async fetchDistinctTradedMarkets() {
    const marketRes = await this.prisma.order.findMany({
      distinct: ['symbol'],
      select: { symbol: true },
    });

    const markets = marketRes.map((symbolItem) => {
      return symbolItem.symbol;
    });

    this.logger.log({ 'Distinct markets': markets });

    return markets;
  }

  /**
   * Based on the distinct traded markets find the distinct list of traded ticker symbols.
   *
   * We care about the quote ticker symbol, as it will be used to fetch historical prices:
   * - Ticker symbol to BTC
   * - Ticker symbol to user fiat base currency (The `FiatCurrency` enum specifies the supported fiat currencies)
   *
   * *The distinct traded markets are fetched from the orders DB table.
   * @returns
   */
  async detectTradedQuoteTickerSymbols() {
    const distinctMarkets = await this.fetchDistinctTradedMarkets();
    const tickerSymbols = {};

    for (const market of distinctMarkets) {
      const { quote } = getTickerSymbols(market);

      if (!tickerSymbols[quote]) {
        tickerSymbols[quote] = true;
      }
    }

    this.logger.log({ tickerSymbols: Object.keys(tickerSymbols) });
    return Object.keys(tickerSymbols);
  }

  async tickerSymbolToBtcPairs() {
    const createPair = (base, quote) => [base, quote].join('/');
    const bitstampCryptoExchange: CryptoExchange = this.bitstampExchange;
    const bitstampExchange = bitstampCryptoExchange.exchange;
    const binanceCryptoExchange: CryptoExchange = this.binanceExchange;
    const binanceExchange = binanceCryptoExchange.exchange;

    const [tickerSymbols] = await Promise.all([
      this.detectTradedQuoteTickerSymbols(),
      bitstampExchange.loadMarkets(),
      binanceExchange.loadMarkets(),
    ]);

    const bitstampMarkets = bitstampExchange.markets;
    const binanceMarkets = binanceExchange.markets;
    const tickerSymbolCryptoMarkets = {
      [binanceCryptoExchange.getName()]: [],
      [bitstampCryptoExchange.getName()]: [],
    };
    const tickerSymbolFiatMarkets = [];
    const unsupportedBtcMarkets = [];
    const unsupportedMarkets = [];

    for (const tickerSymbol of tickerSymbols) {
      if (tickerSymbol === TickerSymbol.BTC) {
        continue;
      }

      // Get the BTC market for the given ticker symbol
      // Check both `BTC/{tickerSymbol}` and `{tickerSymbol}/BTC` against the supported markets
      let btcMarkets = [
        createPair(tickerSymbol, TickerSymbol.BTC),
        createPair(TickerSymbol.BTC, tickerSymbol),
      ];
      let validBinanceBtcMarket;
      let validBitstampBtcMarket;
      for (const market of btcMarkets) {
        if (binanceMarkets[market]) {
          validBinanceBtcMarket = market;
          break;
        } else if (bitstampMarkets[market]) {
          validBitstampBtcMarket = market;
          break;
        }
      }
      if (!validBinanceBtcMarket && !validBitstampBtcMarket) {
        // throw new Error(
        //   `Could not find a valid BTC market for ${tickerSymbol}`,
        // );
        console.log(
          `Could not find a valid BTC market for '${tickerSymbol}' in '${binanceCryptoExchange.getName()}' or '${bitstampCryptoExchange.getName()}'`,
        );
        unsupportedBtcMarkets.push(tickerSymbol);
      }
      if (validBinanceBtcMarket) {
        tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].push(
          validBinanceBtcMarket,
        );
      } else {
        tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].push(
          validBitstampBtcMarket,
        );
      }

      // Get the Fiat market for the given ticker symbol
      for (const fiat of Object.values(FiatCurrency)) {
        if (tickerSymbol === fiat) {
          continue;
        }

        const pair = createPair(tickerSymbol, fiat);
        if (isFiat(tickerSymbol)) {
          tickerSymbolFiatMarkets.push(pair);
        } else {
          // This is a crypto ticker symbol, check it against the supported markets
          if (binanceMarkets[pair]) {
            tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].push(
              pair,
            );
          } else if (bitstampMarkets[pair]) {
            tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].push(
              pair,
            );
          } else {
            // throw new Error(`${pair} is not a supported market`);
            console.log(
              `The '${pair}' market is not a supported  in '${binanceCryptoExchange.getName()}' or '${bitstampCryptoExchange.getName()}'`,
            );
            unsupportedMarkets.push(pair);
          }
        }
      }
    }

    // All unsupported markets fallback to USD
    // e.g. ETH/CHF: ETH/USD -> USD/CHF
    const failedPairs = [];
    for (const market of unsupportedMarkets) {
      const { base, quote } = getTickerSymbols(market);
      const pairs = {
        [createPair(base, FiatCurrency.USD)]: { isFiatPair: isFiat(base) },
        [createPair(FiatCurrency.USD, quote)]: { isFiatPair: isFiat(quote) },
      };

      let atLeastOneFailedPair = false;
      for (const pair of Object.keys(pairs)) {
        // Check if the pairs are already included in the crypto or fiat markets
        this.logger.log(`Checking ${pair}`);
        if (pairs[pair].isFiatPair) {
          this.logger.log({
            existsInFiatPairs: tickerSymbolFiatMarkets.indexOf(pair),
          });
          if (tickerSymbolFiatMarkets.indexOf(pair) === -1) {
            tickerSymbolFiatMarkets.push(pair);
          }
        } else {
          this.logger.log({
            existsInBinance:
              tickerSymbolCryptoMarkets[
                binanceCryptoExchange.getName()
              ].indexOf(pair),
            existsInBitstamp:
              tickerSymbolCryptoMarkets[
                bitstampCryptoExchange.getName()
              ].indexOf(pair),
          });
          if (
            tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].indexOf(
              pair,
            ) === -1 &&
            tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].indexOf(
              pair,
            ) === -1
          ) {
            if (!binanceMarkets[pair]) {
              tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].push(
                pair,
              );
            } else if (!bitstampMarkets[pair]) {
              tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].push(
                pair,
              );
            } else {
              atLeastOneFailedPair = true;
            }
          }
        }
      }
      if (atLeastOneFailedPair) {
        failedPairs.push(market);
      }
    }
    // Fallback to BTC/USD, then ${tickerSymbol}/USD
    this.logger.log({
      tickerSymbolCryptoMarkets,
      tickerSymbolFiatMarkets,
      unsupportedBtcMarkets,
      unsupportedMarkets,
      failedPairs,
    });
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // @Cron(CronExpression.EVERY_10_MINUTES)
  async fetchOHLV() {
    this.logger.debug('fetchOHLV() started.');
    await this.tickerSymbolToBtcPairs();
    this.logger.debug('fetchOHLV() ended.');

    return;
  }
}
