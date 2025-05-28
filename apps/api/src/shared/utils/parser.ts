/**
 * Parse a string value into a boolean
 *
 * @param value The string value to parse
 * @returns true if the value is 'true' (case insensitive), false otherwise
 *
 * @example
 * parseBoolean('true') // returns true
 * parseBoolean('TRUE') // returns true
 * parseBoolean('false') // returns false
 * parseBoolean(undefined) // returns false
 */
export const parseBoolean = (value: string | undefined): boolean => {
  if (value === undefined) return false;
  return value.toLowerCase() === 'true';
};
