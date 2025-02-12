export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getLogTraceID = (source: Array<any>): string => {
  return Buffer.from(source.join('|')).toString('base64');
};

export const logWithTraceID = (logMsg: string, traceID?: string) => {
  const traceIDString = traceID ? `[${traceID}] ` : '';
  return `${traceIDString}${logMsg}`;
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
