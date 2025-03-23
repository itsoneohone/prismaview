import { getFetchPriceLimits } from 'src/lib/common/utils';
import { FetchDirection } from 'src/price/common/constants';

describe('getFetchPriceLimits()', () => {
  const timeframeInHours = 10;
  const timeframeInMins = timeframeInHours * 60;
  const startingDate = new Date(2024, 0, 1, timeframeInHours, 0, 0);

  it('should throw an error if the startingDate is invalid', () => {
    let invalidDate = undefined;
    expect(() =>
      getFetchPriceLimits(invalidDate, timeframeInMins, FetchDirection.ASC),
    ).toThrow(`Invalid startingDate '${invalidDate}'`);

    invalidDate = '';
    expect(() =>
      getFetchPriceLimits(invalidDate, timeframeInMins, FetchDirection.ASC),
    ).toThrow(`Invalid startingDate '${invalidDate}'`);

    invalidDate = new Date(-1, -1, -1);
    expect(() =>
      getFetchPriceLimits(invalidDate, timeframeInMins, FetchDirection.ASC),
    ).toThrow(`Invalid startingDate '${invalidDate}'`);
  });

  describe('fetches price data points from the startingDate onwards (ASC direction)', () => {
    const expectedStart = new Date('2024-01-01T06:00:00.000Z');
    const expectedEnd = new Date('2024-01-01T15:59:00.000Z');

    it('should return the limits based on a starting date unix timestamp', () => {
      const { start, end } = getFetchPriceLimits(
        startingDate.getTime(),
        timeframeInMins,
        FetchDirection.ASC,
      );

      expect(start).toEqual(expectedStart.getTime());
      expect(end).toEqual(expectedEnd.getTime());
    });

    it('should return the limits based on a starting date object', () => {
      const { start, end } = getFetchPriceLimits(
        startingDate,
        timeframeInMins,
        FetchDirection.ASC,
      );

      expect(start).toEqual(expectedStart.getTime());
      expect(end).toEqual(expectedEnd.getTime());
    });

    it('should return the limits based on a starting date string', () => {
      const { start, end } = getFetchPriceLimits(
        startingDate.toISOString(),
        timeframeInMins,
        FetchDirection.ASC,
      );

      expect(start).toEqual(expectedStart.getTime());
      expect(end).toEqual(expectedEnd.getTime());
    });
  });

  describe('fetches price data points from the startingDate backwards (DESC direction)', () => {
    const expectedEnd = new Date('2024-01-01T06:00:00.000Z');
    const expectedStart = new Date('2023-12-31T20:01:00.000Z');

    it('should return the limits based on a starting date unix timestamp', () => {
      const { start, end } = getFetchPriceLimits(
        startingDate.getTime(),
        timeframeInMins,
        FetchDirection.DESC,
      );

      expect(start).toEqual(expectedStart.getTime());
      expect(end).toEqual(expectedEnd.getTime());
    });

    it('should return the limits based on a starting date object', () => {
      const { start, end } = getFetchPriceLimits(
        startingDate,
        timeframeInMins,
        FetchDirection.DESC,
      );

      expect(start).toEqual(expectedStart.getTime());
      expect(end).toEqual(expectedEnd.getTime());
    });

    it('should return the limits based on a starting date string', () => {
      const { start, end } = getFetchPriceLimits(
        startingDate.toISOString(),
        timeframeInMins,
        FetchDirection.DESC,
      );

      expect(start).toEqual(expectedStart.getTime());
      expect(end).toEqual(expectedEnd.getTime());
    });
  });
});
