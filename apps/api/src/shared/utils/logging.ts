export const getLogTraceID = (source: Array<any>): string => {
  return Buffer.from(source.join('|')).toString('base64');
};

export const logWithTraceID = (logMsg: string, traceID?: string) => {
  const traceIDString = traceID ? `[${traceID}] ` : '';
  return `${traceIDString}${logMsg}`;
};
