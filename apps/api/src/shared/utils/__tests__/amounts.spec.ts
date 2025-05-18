import { Prisma } from '@prisma/client';
import { DECIMAL_ROUNDING, getRandomAmount } from 'src/shared/utils/amounts';

describe('getRandomAmount()', () => {
  it('should return a random number rounded to 8 decimal places', () => {
    const MAX_VALUE = 100;
    const randomAmt = getRandomAmount(MAX_VALUE);
    expect(randomAmt).toBeInstanceOf(Prisma.Decimal);
    expect(randomAmt.toNumber()).toBeLessThan(MAX_VALUE);
    expect(randomAmt.toString().split('.')[1].length).toBeLessThanOrEqual(
      DECIMAL_ROUNDING,
    );
  });
});
