import { FiatCurrency } from '@/shared/constants';

export function isFiat(tickerSymbol: string): boolean {
  return Object.keys(FiatCurrency).indexOf(tickerSymbol) > -1;
}

export function createPair(base, quote): string {
  return [base, quote].join('/');
}
