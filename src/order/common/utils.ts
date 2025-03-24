import { Prisma } from '@prisma/client';
import { DECIMAL_ROUNDING, Decimal } from 'src/shared/utils/amounts';

/**
 * Extract the base and the quote currency out of the symbol set by the CCXT library.
 *
 * The symbol is expected to use a `/` to separate the base and the quote currency.
 * In the industry there is no standard regarding the format of the symbols, so we
 * rely on the convention set by the CCXT library.
 * Read more info here: https://docs.ccxt.com/#/README?id=symbols-and-market-ids
 *
 * @param symbol
 * @returns { base, quote, currency }
 */
export function getTickerSymbols(symbol: string) {
  const tickerSymbols = symbol.split('/');

  if (tickerSymbols.length !== 2) {
    throw new Error(`Invalid symbol '${symbol}'.`);
  }

  return {
    base: tickerSymbols[0],
    quote: tickerSymbols[1],
    // All order amounts are designated in the quote currency
    currency: tickerSymbols[1],
  };
}

export function calculateOrderAmounts(
  amount: Prisma.Decimal | number | string,
  price: Prisma.Decimal | number | string,
) {
  const amountDecimal = new Decimal(amount);
  const priceDecimal = new Decimal(price);

  return {
    filled: amountDecimal,
    price: priceDecimal,
    cost: amountDecimal.mul(priceDecimal).toDecimalPlaces(DECIMAL_ROUNDING),
  };
}
