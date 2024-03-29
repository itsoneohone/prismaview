import { DECIMAL_ROUNDING, Decimal } from 'src/common/amounts';
import {
  getTickerSymbols,
  calculateOrderAmounts,
} from 'src/order/common/utils';

describe('calculateOrderAmounts()', () => {
  let inputFilled;
  let inputPrice;
  beforeAll(() => {
    inputFilled = new Decimal(Math.random() * 100);
    inputPrice = new Decimal(Math.random() * 100);
  });

  it('should return all order amounts', () => {
    const orderAmounts = calculateOrderAmounts(inputFilled, inputPrice);
    expect(Object.keys(orderAmounts)).toEqual(['filled', 'price', 'cost']);
  });

  it('should work when the filled amount and price are numbers', () => {
    const { filled, price, cost } = calculateOrderAmounts(
      inputFilled.toNumber(),
      inputPrice.toNumber(),
    );
    const expectedCost = filled.mul(price).toDecimalPlaces(DECIMAL_ROUNDING);

    expect(filled.toNumber()).toEqual(inputFilled.toNumber());
    expect(price.toNumber()).toEqual(inputPrice.toNumber());
    expect(cost.toNumber()).toEqual(expectedCost.toNumber());
  });

  it('should work when the filled amount and price are strings', () => {
    const { filled, price, cost } = calculateOrderAmounts(
      inputFilled.toString(),
      inputPrice.toString(),
    );
    const expectedCost = filled.mul(price).toDecimalPlaces(DECIMAL_ROUNDING);

    expect(filled.toNumber()).toEqual(inputFilled.toNumber());
    expect(price.toNumber()).toEqual(inputPrice.toNumber());
    expect(cost.toNumber()).toEqual(expectedCost.toNumber());
  });

  it('should work when the filled amount and price are Decimals', () => {
    const { filled, price, cost } = calculateOrderAmounts(
      inputFilled,
      inputPrice,
    );
    const expectedCost = filled.mul(price).toDecimalPlaces(DECIMAL_ROUNDING);

    expect(filled.toNumber()).toEqual(inputFilled.toNumber());
    expect(price.toNumber()).toEqual(inputPrice.toNumber());
    expect(cost.toNumber()).toEqual(expectedCost.toNumber());
  });
});

describe('getSymbolCurrencies', () => {
  const base = 'BTC';
  const quote = 'USD';
  // All order amounts are designated in the `currency` which is the same as the quote currency.
  const currency = quote;
  const symbol = [base, quote].join('/');
  const wrongSymbol = [base, quote].join('');

  it('should throw an error if the symbol does not separate the base and quote using a `/`', () => {
    expect(() => getTickerSymbols(wrongSymbol)).toThrow(
      `Invalid symbol '${wrongSymbol}'.`,
    );
  });

  it('should return the base, quote and currency values', () => {
    const {
      base: returnedBase,
      quote: returnedQuote,
      currency: returnedCurrency,
    } = getTickerSymbols(symbol);

    expect(returnedBase).toEqual(base);
    expect(returnedQuote).toEqual(quote);
    expect(returnedCurrency).toEqual(currency);
    expect(returnedCurrency).toEqual(returnedQuote);
  });
});
