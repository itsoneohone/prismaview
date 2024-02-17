import { BitstampExchange } from 'src/lib/exchange/bitstamp-exchange';
import { KrakenExchange } from 'src/lib/exchange/kraken-exchange';

export type CryptoExchange = KrakenExchange | BitstampExchange;
