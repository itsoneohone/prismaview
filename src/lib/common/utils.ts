import { FiatCurrency } from 'src/lib/common/constants';
import { FetchDirection } from 'src/price/common/constants';

export function isFiat(tickerSymbol: string): Boolean {
  return Object.keys(FiatCurrency).indexOf(tickerSymbol) > -1;
}

export function createPair(base, quote): string {
  return [base, quote].join('/');
}

/**
 * Given a starting date, calculate the 'start' and 'end' params that will be used
 * to fetch historical prices.
 *
 * The command sets the the 'start' and 'end' params by taking into account the
 * fetch direction:
 * 1. ASC: the command fetch prices from the starting point date onwards:
 *   - start: the provided starting point timestamp.
 *   - end: start + (timeframeInMins - 1) * 60 (secs) * 1000 (ms)
 * (Time increases to the right)
 *
 * startingDate (provided timestamp)
 *      │
 *      │   <-- start: the startingDate timestamp
 *      ▼
 *    [ start ]
 *      │
 *      │  (Add (timeframeInMins - 1) minutes)
 *      │      i.e., (timeframeInMins - 1) * 60 * 1000 milliseconds
 *      ▼
 *    [  end  ]
 *
 * 2. DESC: the command fetch prices from the starting point date backwards:
 *   - end: the provided starting point timestamp.
 *   - start: end - (timeframeInMins - 1) * 60 (secs) * 1000 (ms)
 *
 * (Time decreases to the left)
 *
 * startingDate (provided timestamp)
 *      │
 *      │   <-- end: the startingDate timestamp
 *      ▼
 *    [  end  ]
 *      │
 *      │  (Subtract (timeframeInMins - 1) minutes)
 *      │      i.e., (timeframeInMins - 1) * 60 * 1000 milliseconds
 *      ▼
 *    [ start ]
 * @param startingDate date object, date string, timestamp
 * @param timeframeInMins Timeframe refers to the length of time each price point represents (e.g. 1m, 5m, 10m).
 *                        By default we use '1m' to account for price volatility, so the timeframeInMins
 *                        is essentially the 'limit' param used when we fetch price data points from an
 *                        exchange. This is because we fetch one price point for each timeframe, that is a minute.
 * @param direction FetchDirection
 * @returns
 */
export function getFetchPriceLimits(
  startingDate: number | Date | string,
  timeframeInMins: number,
  direction: FetchDirection,
) {
  const validatedStartingDate = new Date(startingDate);
  const validatedStartingTimestamp = validatedStartingDate.getTime();

  if (isNaN(validatedStartingTimestamp) || validatedStartingTimestamp < 0) {
    throw new Error(`Invalid startingDate '${startingDate}'`);
  }

  let start;
  let end;
  if (direction === FetchDirection.ASC) {
    start = validatedStartingTimestamp;
    end = start + (timeframeInMins - 1) * 60 * 1000;
  } else {
    end = validatedStartingTimestamp;
    start = end - (timeframeInMins - 1) * 60 * 1000;
  }

  return { start, end };
}
