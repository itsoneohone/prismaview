// The Log definition used to be exported, but this changed in a recent update
// import { LogDefinition } from '@prisma/client/runtime/library';
export declare type LogDefinition = {
  level: 'info' | 'query' | 'warn' | 'error';
  emit: 'stdout' | 'event';
};
