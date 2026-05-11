import { createClient } from 'redis';
import { REDIS_CLIENT, RedisClient, RedisModuleOptions } from './redis.constant';
import { RedisService } from './redis.service';
import { DynamicModule, Global, Module, FactoryProvider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

type RedisModuleAsyncOptions = {
  inject?: any[];
  useFactory: (...args: any[]) => RedisModuleOptions | Promise<RedisModuleOptions>;
};

@Global()
@Module({})
export class RedisModule {
  // Singleton guard — holds the client promise across repeated forRootAsync calls
  private static clientInstance: Promise<RedisClient> | null = null;

  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const redisProvider: FactoryProvider<Promise<RedisClient>> = {
      provide: REDIS_CLIENT,
      useFactory: async (...args: any[]): Promise<RedisClient> => {
        // Return the cached promise if already initialised
        if (RedisModule.clientInstance) {
          return RedisModule.clientInstance;
        }

        RedisModule.clientInstance = (async (): Promise<RedisClient> => {
          const opts = await options.useFactory(...args);

          const reconnectStrategy =
            opts.reconnectStrategy ??
            ((retries: number) => {
              const jitter = Math.floor(Math.random() * 100);
              return Math.min(Math.pow(2, retries) * 50, 3000) + jitter;
            });

          const client = createClient({
            url: `redis://${opts.host}:${opts.port}/${opts.db ?? 0}`,
            password: opts.password,
            socket: opts.tls ? { tls: true as const, reconnectStrategy } : { tls: false as const, reconnectStrategy },
          });

          client.on('error', (err: Error) => {
            console.error('❌ Redis error', err);
            // Reset so reconnection can be attempted on next bootstrap
            RedisModule.clientInstance = null;
          });

          client.on('reconnecting', () => {
            console.warn('🔄 Redis reconnecting...');
          });

          await client.connect();
          console.log('✅ Redis connected');

          return client;
        })();

        return RedisModule.clientInstance;
      },
      inject: options.inject || [],
    };

    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [redisProvider, RedisService],
      exports: [RedisService, REDIS_CLIENT],
    };
  }
}
