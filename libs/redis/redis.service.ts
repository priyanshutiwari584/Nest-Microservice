import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import * as redis from 'redis';
import { REDIS_CLIENT } from './redis.constant';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly client: redis.RedisClientType,
  ) {}

  getClient(): redis.RedisClientType {
    return this.client;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    const options: { EX?: number } = {};
    if (ttlSeconds) options.EX = ttlSeconds;

    console.log(`[REDIS][SET] key=${key} ttl=${ttlSeconds ?? 'none'}`);
    await this.client.set(key, data, options);
  }

  async del(key: string): Promise<void> {
    console.log(`[REDIS][DEL] key=${key}`);
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    const exists = count === 1;
    console.log(`[REDIS][EXISTS] key=${key} exists=${exists}`);
    return exists;
  }

  async setIfNotExists(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const data = JSON.stringify(value);
    const options: { EX?: number; NX: boolean } = { NX: true };
    if (ttlSeconds) options.EX = ttlSeconds;

    const result = await this.client.set(key, data, options);
    return result === 'OK';
  }

  async onModuleDestroy() {
    console.log('[REDIS][DISCONNECT] Redis disconnecting');
    await this.client.quit();
  }
}
