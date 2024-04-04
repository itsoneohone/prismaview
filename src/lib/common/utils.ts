import { FiatCurrency } from 'src/lib/common/constants';

export function isFiat(tickerSymbol: string): Boolean {
  return Object.keys(FiatCurrency).indexOf(tickerSymbol) > -1;
}

export function createPair(base, quote): string {
  return [base, quote].join('/');
}

/**
 *
 * @param endTimestamp Unix timestamp in milliseconds
 */
export function calculateStartTimestamp(
  endDate: number | Date | string,
  timeframeInMins: number,
) {
  const validatedEndDate = new Date(endDate);
  const endTimestamp = validatedEndDate.getTime();

  if (isNaN(endTimestamp) || endTimestamp < 0) {
    throw new Error(`Invalid endDate '${endDate}'`);
  }

  return endTimestamp - timeframeInMins * 60 * 1000;
}
