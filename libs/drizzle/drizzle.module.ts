import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/schema';

export const DRIZZLE = Symbol('drizzle-connection');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const user = configService.get<string>('POSTGRES_USER');
        const password = configService.get<string>('POSTGRES_PASSWORD');
        const port = configService.get<string>('POSTGRES_PORT');
        const db = configService.get<string>('POSTGRES_DB');

        const pool = new Pool({
          connectionString: `postgresql://${user}:${password}@localhost:${port}/${db}`,
          ssl: false, // set to true if your PostgreSQL server requires SSL connections
        });

        return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
