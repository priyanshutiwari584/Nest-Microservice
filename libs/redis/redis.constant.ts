import type { createClient, RedisClientOptions } from 'redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export type RedisClient = ReturnType<typeof createClient>;

// Re-export for consumers who need the raw redis config shape
export type { RedisClientOptions };

export interface RedisModuleOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  tls?: boolean;
  reconnectStrategy?: (retries: number, cause: Error) => number | Error;
}
