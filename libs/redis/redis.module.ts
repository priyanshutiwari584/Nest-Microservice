import { createClient } from 'redis';
import { REDIS_CLIENT, RedisOptions } from './redis.constant';
import { RedisService } from './redis.service';
import { DynamicModule, Global, Module, FactoryProvider } from '@nestjs/common';

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

@Global()
@Module({})
export class RedisModule {
  static forRoot(options: RedisOptions): DynamicModule {
    const redisProvider: FactoryProvider<Promise<RedisClient>> = {
      provide: REDIS_CLIENT,
      useFactory: async (): Promise<RedisClient> => {
        if (redisClient) return redisClient;

        const client: RedisClient = createClient({
          socket: {
            host: options.host,
            port: options.port,
          },
          password: options.password,
          database: options.db,
        });

        client.on('error', (err: Error) => {
          console.error('❌ Redis error', err);
        });

        await client.connect();
        console.log('✅ Redis connected');

        redisClient = client;
        return redisClient;
      },
    };

    return {
      module: RedisModule,
      providers: [redisProvider, RedisService],
      exports: [RedisService, REDIS_CLIENT],
    };
  }
}
