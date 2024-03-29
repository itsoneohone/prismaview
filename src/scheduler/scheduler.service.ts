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
import { createPair, isFiat } from 'src/lib/common/utils';
import { BinanceExchange } from 'src/lib/exchange/binance-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { CryptoExchange } from 'src/lib/exchange/types';
import { Dictionary } from 'ccxt';

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
   * @returns Array of traded markets
   * e.g.
   */
  private async _fetchDistinctTradedMarkets() {
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
   * The distinct traded markets are fetched from the orders DB table.
   *
   * @returns Array of distinct traded quote ticker symbols
   * e.g. [
   *   "EUR",
   *   "USD",
   *   "BTC",
   *   "ETH",
   *   "USDT"
   * ]
   */
  private async _detectTradedQuoteTickerSymbols() {
    const distinctMarkets = await this._fetchDistinctTradedMarkets();
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

  /**
   * Find a BTC market for a given ticker symbol in any of the available exchanges.
   *
   * *If a BTC market is not available in any of the available exchanges, the market is stored in the
   * 'unsupportedBtcMarkets'. Currently there are not unsupported BTC markets, and so this list is not
   * being processed.
   *
   * *The available exchanges are currently Binance and Bitstamp. Kraken is not used in this case, because it
   * only offers the last 720 data points for the interval in use
   * [https://docs.kraken.com/rest/#tag/Spot-Market-Data/operation/getOHLCData]).
   *
   *
   * @param tickerSymbol
   * @param binanceMarkets
   * @param bitstampMarkets
   * @param param3
   */
  _findQuoteToBtcMarket(
    tickerSymbol: string,
    binanceMarkets: Dictionary<any>,
    bitstampMarkets: Dictionary<any>,
    { tickerSymbolCryptoMarkets, unsupportedBtcMarkets },
  ) {
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
      unsupportedBtcMarkets.push(tickerSymbol);
    }

    if (validBinanceBtcMarket) {
      tickerSymbolCryptoMarkets[ExchangeNameEnum.BINANCE].push(
        validBinanceBtcMarket,
      );
    } else {
      tickerSymbolCryptoMarkets[ExchangeNameEnum.BITSTAMP].push(
        validBitstampBtcMarket,
      );
    }
  }

  /**
   * Get the Fiat markets for the given quote ticker symbol in any of the available exchanges.
   *
   * In the case of fiat markets it simply keeps the market in an array.
   * If a crypto market is not available in any of the available exchanges, the market is stored in the
   * 'unsupportedMarkets', which will be processed by the _findQuoteToFiatMarketUsingUSDProxy() fn to
   * do a double conversion via a market chain: e.g ETH/CHF: ETH/USD -> USD/CHF
   *
   * *The available exchanges are currently Binance and Bitstamp. Kraken is not used in this case, because it
   * only offers the last 720 data points for the interval in use
   * [https://docs.kraken.com/rest/#tag/Spot-Market-Data/operation/getOHLCData]).
   *
   * @param tickerSymbol
   * @param binanceMarkets
   * @param bitstampMarkets
   * @param param3
   */
  private _findQuoteToFiatMarket(
    tickerSymbol: string,
    binanceMarkets: Dictionary<any>,
    bitstampMarkets: Dictionary<any>,
    { tickerSymbolCryptoMarkets, tickerSymbolFiatMarkets, unsupportedMarkets },
  ) {
    // Get the Fiat market for the given quote ticker symbol
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
          tickerSymbolCryptoMarkets[ExchangeNameEnum.BINANCE].push(pair);
        } else if (bitstampMarkets[pair]) {
          tickerSymbolCryptoMarkets[ExchangeNameEnum.BITSTAMP].push(pair);
        } else {
          unsupportedMarkets.push(pair);
        }
      }
    }
  }

  /**
   * Process all unsupported markets to create a market chain using USD as a proxy.
   *
   * This way we will be able to convert to the desired user currency via a double conversion:
   * e.g ETH/CHF: ETH/USD -> USD/CHF
   *
   * *The available exchanges are currently Binance and Bitstamp. Kraken is not used in this case, because it
   * only offers the last 720 data points for the interval in use
   * [https://docs.kraken.com/rest/#tag/Spot-Market-Data/operation/getOHLCData]).
   *
   * @param binanceMarkets
   * @param bitstampMarkets
   * @param unsupportedMarkets
   * @param param3
   */
  private _findQuoteToFiatMarketUsingUSDProxy(
    binanceMarkets,
    bitstampMarkets,
    unsupportedMarkets,
    { tickerSymbolCryptoMarkets, tickerSymbolFiatMarkets, failedMarkets },
  ) {
    // All unsupported markets, that is those which are not supported neither from Binance nor from Bitstamp,
    // they will fallback to USD. There will be a double conversion from base to USD and then from USD to quote.
    // e.g. ETH/CHF: ETH/USD -> USD/CHF
    for (const market of unsupportedMarkets) {
      const { base, quote } = getTickerSymbols(market);
      const marketChain = {
        [createPair(base, FiatCurrency.USD)]: { isFiatMarket: isFiat(base) },
        [createPair(FiatCurrency.USD, quote)]: { isFiatMarket: isFiat(quote) },
      };

      let atLeastOneFailedMarket = false;
      for (const market of Object.keys(marketChain)) {
        // Check if the markets are already included in the crypto or fiat markets
        if (marketChain[market].isFiatMarket) {
          // This pair is not already included in the identified ticker symbol fiat markets
          if (tickerSymbolFiatMarkets.indexOf(market) === -1) {
            tickerSymbolFiatMarkets.push(market);
          }
        } else {
          // This pair is not already included in the identified ticker symbol crypto markets
          if (
            tickerSymbolCryptoMarkets[ExchangeNameEnum.BINANCE].indexOf(
              market,
            ) === -1 &&
            tickerSymbolCryptoMarkets[ExchangeNameEnum.BITSTAMP].indexOf(
              market,
            ) === -1
          ) {
            // Check if the pair is availabe in Binance or Bitstamp
            if (!binanceMarkets[market]) {
              tickerSymbolCryptoMarkets[ExchangeNameEnum.BINANCE].push(market);
            } else if (!bitstampMarkets[market]) {
              tickerSymbolCryptoMarkets[ExchangeNameEnum.BITSTAMP].push(market);
            } else {
              // The pair is not available in any of the available exchanges.
              atLeastOneFailedMarket = true;
            }
          }
        }
      }

      if (atLeastOneFailedMarket) {
        failedMarkets.push(market);
      }
    }
  }

  /**
   * Find all of the markets for which the system needs historical prices (OHLCV or FX rates)
   * so that all order amounts can be converted to BTC and the selected user fiat currency.
   *
   * We follow the steps below:
   *
   * 1. Find the distinct markets based on the user orders.
   * e.g. [
   *   "BTC/EUR",
   *   "BTC/USD",
   *   "ETH/USD",
   *   "MATIC/USD",
   *   "MATIC/EUR",
   *   "ETH/EUR",
   *   "ADA/EUR",
   *   "LTC/USD",
   *   "LTC/BTC",
   *   "LTC/ETH",
   *   "USDT/EUR",
   *   "BTC/USDT",
   *   "XLM/BTC"
   * ]
   *
   * 2. Based on the above markets, get the distinct list of traded quote ticker symbols
   * e.g. [
   *   "EUR",
   *   "USD",
   *   "BTC",
   *   "ETH",
   *   "USDT"
   * ]
   *
   * 3. Based on the above list, create all "quoteTickerSymbol/BTC" and "quoteTickerSymbol/UserFiatCurrency" markets
   *    and check if they are supported either by Binance or Bitstamp (only these 2 exchanges offer historical OHLCV
   *    prices. Kraken only offers the last 720 data points for the interval in use [https://docs.kraken.com/rest/#tag/Spot-Market-Data/operation/getOHLCData]).
   *    Also, keep track of the unsupported markets.
   * e.g.
   * {
   *   "tickerSymbolCryptoMarkets": {
   *     "BINANCE": [
   *       "BTC/EUR",
   *       "ETH/BTC",
   *       "ETH/GBP",
   *       "ETH/EUR",
   *       "ETH/JPY",
   *       "BTC/USDT"
   *     ],
   *     "BITSTAMP": [
   *       "BTC/USD",
   *       "ETH/USD",
   *       "USDT/EUR",
   *       "USDT/USD"
   *     ]
   *   },
   *   "tickerSymbolFiatMarkets": [
   *     "EUR/CHF",
   *     "EUR/GBP",
   *     "EUR/JPY",
   *     "EUR/USD",
   *     "USD/EUR",
   *   ],
   *   "unsupportedBtcMarkets": [],
   *   "unsupportedMarkets": [
   *     "ETH/CHF",
   *     "USDT/CHF",
   *     "USDT/GBP",
   *     "USDT/JPY"
   *   ],
   * }
   *
   * 4. All unsupported markets, that is those which are not supported neither from Binance nor from Bitstamp,
   *    they will fallback to USD. There will be a double conversion from base to USD and then from USD to quote.
   *    e.g. ETH/CHF: ETH/USD -> USD/CHF.
   *
   *    The end result will be the following set of pairs, for which the system will fetch OHLCV pricing data
   *    or FX rates.
   * e.g.
   * {
   *   "tickerSymbolCryptoMarkets": {
   *     "BINANCE": [
   *       "BTC/EUR",
   *       "ETH/BTC",
   *       "ETH/GBP",
   *       "ETH/EUR",
   *       "ETH/JPY",
   *       "BTC/USDT"
   *     ],
   *     "BITSTAMP": [
   *       "BTC/USD",
   *       "ETH/USD",
   *       "USDT/EUR",
   *       "USDT/USD"
   *     ]
   *   },
   *   "tickerSymbolFiatMarkets": [
   *     "EUR/CHF",
   *     "EUR/GBP",
   *     "EUR/JPY",
   *     "EUR/USD",
   *     "USD/CHF",
   *     "USD/GBP",
   *     "USD/EUR",
   *     "USD/JPY",
   *   ],
   *   "unsupportedBtcMarkets": [],
   *   "unsupportedMarkets": [
   *     "ETH/CHF",
   *     "USDT/CHF",
   *     "USDT/GBP",
   *     "USDT/JPY"
   *   ],
   * }
   */
  private async findTickerSymbolToMarkets() {
    const bitstampCryptoExchange: CryptoExchange = this.bitstampExchange;
    const bitstampExchange = bitstampCryptoExchange.exchange;
    const binanceCryptoExchange: CryptoExchange = this.binanceExchange;
    const binanceExchange = binanceCryptoExchange.exchange;

    const [quoteTickerSymbols] = await Promise.all([
      this._detectTradedQuoteTickerSymbols(),
      bitstampExchange.loadMarkets(),
      binanceExchange.loadMarkets(),
    ]);

    const binanceMarkets = binanceExchange.markets;
    const bitstampMarkets = bitstampExchange.markets;
    const tickerSymbolCryptoMarkets = {
      [binanceCryptoExchange.getName()]: [],
      [bitstampCryptoExchange.getName()]: [],
    };
    const tickerSymbolFiatMarkets = [];
    const unsupportedBtcMarkets = [];
    const unsupportedMarkets = [];

    // For each quote ticker symbol find a valid BTC in Binance or Bitstamp
    for (const tickerSymbol of quoteTickerSymbols) {
      if (tickerSymbol === TickerSymbol.BTC) {
        continue;
      }

      // Get the BTC market for the given ticker symbol
      // Check both `BTC/{tickerSymbol}` and `{tickerSymbol}/BTC` against the supported markets
      this._findQuoteToBtcMarket(
        tickerSymbol,
        binanceMarkets,
        bitstampMarkets,
        {
          // Vars passed by reference to store the result of the function's operation
          tickerSymbolCryptoMarkets,
          unsupportedBtcMarkets,
        },
      );

      // Get the Fiat markets for the given quote ticker symbol
      this._findQuoteToFiatMarket(
        tickerSymbol,
        binanceMarkets,
        bitstampMarkets,
        {
          // Vars passed by reference to store the result of the function's operation
          tickerSymbolCryptoMarkets,
          tickerSymbolFiatMarkets,
          unsupportedMarkets,
        },
      );
    }

    // All unsupported markets, that is those which are not supported neither from Binance nor from Bitstamp,
    // they will fallback to USD. There will be a double conversion from base to USD and then from USD to quote.
    // e.g. ETH/CHF: ETH/USD -> USD/CHF
    const failedMarkets = [];
    this._findQuoteToFiatMarketUsingUSDProxy(
      binanceMarkets,
      bitstampMarkets,
      unsupportedMarkets,
      {
        tickerSymbolCryptoMarkets,
        tickerSymbolFiatMarkets,
        failedMarkets,
      },
    );

    // We currently don't process the unsupported BTC markets, because we have no occurrences of those.
    // Should there are occurrences in the future, treat them the same way as the rest unsupported markets.
    if (unsupportedBtcMarkets.length) {
      this.logger.error(
        'The following BTC markets are not supported by BINANCE or BITSTAMP. Find an alternative exchange!',
      );
      this.logger.error({ unsupportedBtcMarkets });
    }

    if (failedMarkets.length) {
      this.logger.error('Detected the following failed markets.');
      this.logger.error({ unsupportedBtcMarkets });
    }

    const res = {
      tickerSymbolCryptoMarkets,
      tickerSymbolFiatMarkets,
      unsupportedBtcMarkets,
      unsupportedMarkets,
      failedMarkets,
    };
    this.logger.log(res);
    return res;
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // @Cron(CronExpression.EVERY_10_MINUTES)
  async fetchOHLV() {
    const startTime = new Date().getTime();
    this.logger.debug('fetchOHLV() started.');
    await this.findTickerSymbolToMarkets();
    const endTime = new Date().getTime();
    this.logger.debug(
      `fetchOHLV() completed in ${(endTime - startTime) / 1000} secs.`,
    );

    return;
  }
}
