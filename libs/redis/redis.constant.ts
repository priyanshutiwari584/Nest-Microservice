import type { createClient } from 'redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export type RedisClient = ReturnType<typeof createClient>;

export interface RedisOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}
