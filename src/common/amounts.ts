import { Prisma } from '@prisma/client';

export const DECIMAL_ROUNDING = 8;
export const Decimal = Prisma.Decimal.set({ rounding: DECIMAL_ROUNDING });

/**
 * Get a random decimal amount, rounded at 8 decimal places
 *
 * @param maxValue
 * @returns
 */
export const getRandomAmount = (maxValue: number) => {
  return new Decimal(Math.random() * maxValue).toDecimalPlaces(
    DECIMAL_ROUNDING,
  );
};
