import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeNameEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FiatCurrency, TickerSymbol } from 'src/lib/common/constants';
import { createPair, isFiat } from 'src/lib/common/utils';
import { BinanceExchange } from 'src/lib/exchange/binance-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { CryptoExchange } from 'src/lib/exchange/types';
import { getTickerSymbols } from 'src/order/common/utils';
import { CreatePriceDto } from 'src/price/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { uniq } from 'lodash';

@Injectable()
export class PriceService {
  private logger = new Logger(PriceService.name);
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
   * Query all user orders and get the distinct traded markets
   *
   * @returns Array of traded markets
   * e.g.
   */
  private async _fetchDistinctTradedMarkets() {
    const startTs = new Date().getTime();
    const marketRes = await this.prisma.order.findMany({
      distinct: ['symbol'],
      select: { symbol: true },
    });

    const markets = marketRes.map((symbolItem) => {
      return symbolItem.symbol;
    });

    this.logger.log({ 'Distinct markets': markets });
    const endTs = new Date().getTime();
    this.logger.log(
      `Fetched distinct traded markets in ${(endTs - startTs) / 1000} secs`,
    );

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
    const startTs = new Date().getTime();
    const distinctMarkets = await this._fetchDistinctTradedMarkets();
    const tickerSymbols = {};

    for (const market of distinctMarkets) {
      const { quote } = getTickerSymbols(market);

      if (!tickerSymbols[quote]) {
        tickerSymbols[quote] = true;
      }
    }

    this.logger.log({ tickerSymbols: Object.keys(tickerSymbols) });
    const endTs = new Date().getTime();
    this.logger.log(
      `Detected traded quote ticker symbols in ${(endTs - startTs) / 1000} secs`,
    );

    return Object.keys(tickerSymbols);
  }

  /**
   * Find a BTC market for a given ticker symbol in any of the available exchanges.
   *
   * *If a BTC market is not available in any of the available exchanges, the market is marked as
   * 'unsupportedBtcMarket'. Currently there are not unsupported BTC markets, and so this list is not
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
  _findQuoteToBtcMarket(tickerSymbol: string) {
    const binanceMarkets = this.binanceExchange.exchange.markets;
    const bitstampMarkets = this.bitstampExchange.exchange.markets;
    // Get the BTC market for the given ticker symbol
    // Check both `BTC/{tickerSymbol}` and `{tickerSymbol}/BTC` against the supported markets
    let btcMarkets = [
      createPair(tickerSymbol, TickerSymbol.BTC),
      createPair(TickerSymbol.BTC, tickerSymbol),
    ];
    let validBinanceBtcMarket;
    let validBitstampBtcMarket;

    for (const market of btcMarkets) {
      if (bitstampMarkets[market]) {
        validBitstampBtcMarket = market;
        break;
      } else if (binanceMarkets[market]) {
        validBinanceBtcMarket = market;
        break;
      }
    }

    return {
      validBinanceBtcMarket,
      validBitstampBtcMarket,
      unsupportedBtcMarket: !validBinanceBtcMarket && !validBitstampBtcMarket,
    };
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
  private _findQuoteToFiatMarket(tickerSymbol: string) {
    const binanceMarkets = this.binanceExchange.exchange.markets;
    const bitstampMarkets = this.bitstampExchange.exchange.markets;
    const binanceTickerSymbolCryptoMarkets = [];
    const bitstampTickerSymbolCryptoMarkets = [];
    const tickerSymbolFiatMarkets = [];
    const unsupportedMarkets = [];

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
        if (bitstampMarkets[pair]) {
          bitstampTickerSymbolCryptoMarkets.push(pair);
        } else if (binanceMarkets[pair]) {
          binanceTickerSymbolCryptoMarkets.push(pair);
        } else {
          unsupportedMarkets.push(pair);
        }
      }
    }

    return {
      tickerSymbolFiatMarkets,
      binanceTickerSymbolCryptoMarkets,
      bitstampTickerSymbolCryptoMarkets,
      unsupportedMarkets,
    };
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
  private _findQuoteToFiatMarketUsingUSDProxy(unsupportedMarkets) {
    const binanceMarkets = this.binanceExchange.exchange.markets;
    const bitstampMarkets = this.bitstampExchange.exchange.markets;
    const failedMarkets = [];
    const unsupportedMarketsProxyChain = {};
    let binanceTickerSymbolCryptoMarkets = [];
    let bitstampTickerSymbolCryptoMarkets = [];
    let tickerSymbolFiatMarkets = [];

    // All unsupported markets, that is those which are not supported neither from Binance nor from Bitstamp,
    // they will fallback to USD. There will be a double conversion from base to USD and then from USD to quote.
    // e.g. ETH/CHF: ETH/USD -> USD/CHF
    for (const unsupportedMarket of unsupportedMarkets) {
      const { base, quote } = getTickerSymbols(unsupportedMarket);
      const firstChainLink = createPair(base, FiatCurrency.USD);
      const lastChainLink = createPair(FiatCurrency.USD, quote);
      const marketChain = {
        [firstChainLink]: { isFiatMarket: isFiat(base) },
        [lastChainLink]: { isFiatMarket: isFiat(quote) },
      };
      this.logger.log(
        `Proxy chain for unsupported market ${unsupportedMarket}: ${createPair(base, FiatCurrency.USD)} -> ${createPair(FiatCurrency.USD, quote)}`,
      );
      let atLeastOneFailedMarket = false;
      for (const market of Object.keys(marketChain)) {
        // Check if the markets are already included in the crypto or fiat markets
        if (marketChain[market].isFiatMarket) {
          tickerSymbolFiatMarkets.push(market);
        } else {
          // Check if the pair is availabe in Binance or Bitstamp
          if (bitstampMarkets[market]) {
            bitstampTickerSymbolCryptoMarkets.push(market);
          } else if (binanceMarkets[market]) {
            binanceTickerSymbolCryptoMarkets.push(market);
          } else {
            // The pair is not available in any of the available exchanges.
            atLeastOneFailedMarket = true;
          }
        }
      }

      if (atLeastOneFailedMarket) {
        failedMarkets.push(unsupportedMarket);
      } else {
        // A market chain could be created for this unsupported market
        unsupportedMarketsProxyChain[unsupportedMarket] = [
          firstChainLink,
          lastChainLink,
        ];
      }
    }
    tickerSymbolFiatMarkets = uniq(tickerSymbolFiatMarkets);
    bitstampTickerSymbolCryptoMarkets = uniq(bitstampTickerSymbolCryptoMarkets);
    binanceTickerSymbolCryptoMarkets = uniq(binanceTickerSymbolCryptoMarkets);

    return {
      tickerSymbolFiatMarkets,
      binanceTickerSymbolCryptoMarkets,
      bitstampTickerSymbolCryptoMarkets,
      unsupportedMarketsProxyChain,
      failedMarkets,
    };
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

    const quoteTickerSymbols = await this._detectTradedQuoteTickerSymbols();

    this.logger.log('Loading markets from BINANCE and BITSTAMP...');
    const startTs = new Date().getTime();
    await Promise.all([
      bitstampExchange.loadMarkets(),
      binanceExchange.loadMarkets(),
    ]);
    const endTs = new Date().getTime();
    this.logger.log(`Loaded markets in ${(endTs - startTs) / 1000} secs`);

    const tickerSymbolCryptoMarkets = {
      [binanceCryptoExchange.getName()]: [],
      [bitstampCryptoExchange.getName()]: [],
    };
    let tickerSymbolFiatMarkets = [];
    let unsupportedBtcMarkets = [];
    let unsupportedMarkets = [];

    // For each quote ticker symbol find a valid BTC in Binance or Bitstamp
    for (const tickerSymbol of quoteTickerSymbols) {
      if (tickerSymbol === TickerSymbol.BTC) {
        continue;
      }

      // Get the BTC market for the given ticker symbol
      // Check both `BTC/{tickerSymbol}` and `{tickerSymbol}/BTC` against the supported markets
      const {
        validBinanceBtcMarket,
        validBitstampBtcMarket,
        unsupportedBtcMarket,
      } = this._findQuoteToBtcMarket(tickerSymbol);

      if (validBinanceBtcMarket) {
        tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].push(
          validBinanceBtcMarket,
        );
      } else if (validBitstampBtcMarket) {
        tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].push(
          validBitstampBtcMarket,
        );
      } else if (unsupportedBtcMarket) {
        unsupportedBtcMarkets.push(unsupportedBtcMarket);
      }

      // Get the Fiat markets for the given quote ticker symbol
      const {
        tickerSymbolFiatMarkets: internalTickerSymbolFiatMarkets,
        binanceTickerSymbolCryptoMarkets,
        bitstampTickerSymbolCryptoMarkets,
        unsupportedMarkets: internalUnsupportedMarkets,
      } = this._findQuoteToFiatMarket(tickerSymbol);
      tickerSymbolFiatMarkets.push(...internalTickerSymbolFiatMarkets);
      tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].push(
        ...binanceTickerSymbolCryptoMarkets,
      );
      tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].push(
        ...bitstampTickerSymbolCryptoMarkets,
      );
      unsupportedMarkets.push(...internalUnsupportedMarkets);
    }

    // Keep unique values
    unsupportedMarkets = uniq(unsupportedMarkets);

    // All unsupported markets, that is those which are not supported neither from Binance nor from Bitstamp,
    // they will fallback to USD. There will be a double conversion from base to USD and then from USD to quote.
    // e.g. ETH/CHF: ETH/USD -> USD/CHF
    const {
      tickerSymbolFiatMarkets: internalTickerSymbolFiatMarkets,
      binanceTickerSymbolCryptoMarkets,
      bitstampTickerSymbolCryptoMarkets,
      unsupportedMarketsProxyChain,
      failedMarkets,
    } = this._findQuoteToFiatMarketUsingUSDProxy(unsupportedMarkets);
    tickerSymbolFiatMarkets.push(...internalTickerSymbolFiatMarkets);
    tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()].push(
      ...binanceTickerSymbolCryptoMarkets,
    );
    tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()].push(
      ...bitstampTickerSymbolCryptoMarkets,
    );

    // Keep unique values
    tickerSymbolFiatMarkets = uniq(tickerSymbolFiatMarkets);
    tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()] = uniq(
      tickerSymbolCryptoMarkets[binanceCryptoExchange.getName()],
    );
    tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()] = uniq(
      tickerSymbolCryptoMarkets[bitstampCryptoExchange.getName()],
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
      unsupportedMarketsProxyChain,
      failedMarkets,
    };
    this.logger.log(res);
    return res;
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

  async cmdFetchHistoricalPrices() {
    await this.findTickerSymbolToMarkets();
  }
}
