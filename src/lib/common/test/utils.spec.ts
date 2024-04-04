import { calculateStartTimestamp } from 'src/lib/common/utils';

describe('calculateStartTimestamp()', () => {
  const timeframeInHours = 10;
  const timeframeInMins = timeframeInHours * 60;
  const endDate = new Date(2024, 0, 1, timeframeInHours, 0, 0);
  const expectedStartDate = new Date(2024, 0, 1, 0, 0, 0);

  it('should throw an error if the start date is invalid', () => {
    let invalidDate = undefined;
    expect(() => calculateStartTimestamp(invalidDate, timeframeInMins)).toThrow(
      `Invalid endDate '${invalidDate}'`,
    );

    invalidDate = '';
    expect(() => calculateStartTimestamp(invalidDate, timeframeInMins)).toThrow(
      `Invalid endDate '${invalidDate}'`,
    );

    invalidDate = new Date(-1, -1, -1);
    expect(() => calculateStartTimestamp(invalidDate, timeframeInMins)).toThrow(
      `Invalid endDate '${invalidDate}'`,
    );
  });

  it('should return a start unix timestamp in ms based on an end unix timestamp', () => {
    const startTimestamp = calculateStartTimestamp(
      endDate.getTime(),
      timeframeInMins,
    );

    expect(startTimestamp).toEqual(expectedStartDate.getTime());
  });

  it('should return a start unix timestamp in ms based on an end date object', () => {
    const startTimestamp = calculateStartTimestamp(endDate, timeframeInMins);

    expect(startTimestamp).toEqual(expectedStartDate.getTime());
  });

  it('should return a start unix timestamp in ms based on an end date string', () => {
    const startTimestamp = calculateStartTimestamp(
      endDate.toISOString(),
      timeframeInMins,
    );

    expect(startTimestamp).toEqual(expectedStartDate.getTime());
  });
});
