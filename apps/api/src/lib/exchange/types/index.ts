import { BinanceExchange } from 'src/lib/exchange/binance-exchange';
import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { KrakenExchange } from 'src/lib/exchange/kraken-exchange';

export type CryptoExchange =
  | KrakenExchange
  | BinanceExchange
  | BitstampExchange;
