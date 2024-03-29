import { FiatCurrency } from 'src/lib/common/constants';

export function isFiat(tickerSymbol: string): Boolean {
  return Object.keys(FiatCurrency).indexOf(tickerSymbol) > -1;
}

export function createPair(base, quote): string {
  return [base, quote].join('/');
}
