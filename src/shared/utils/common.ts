export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Return a valid date object or null if the provided date (string/object) is invalid.
 *
 * @param input Date string or object
 * @returns Date | null
 */
export const parseDate = (input: string | Date): Date | null => {
  const date = input instanceof Date ? input : new Date(input);
  return isNaN(date.getTime()) ? null : date;
};
