import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtVerifierService } from 'libs/common/jwt/jwt-service';
import { AuthGuard } from 'libs/common/guard/auth-gaurd.gaurd';
import { KeycloakClient } from 'apps/api-gateway/src/auth/keycloak';
import { RedisModule } from 'libs/redis';
import { DrizzleModule } from 'libs/drizzle';
import { AccessTokenStrategy, RefreshTokenStrategy } from '../strategy';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        host: config.get<string>('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        password: config.get<string>('REDIS_PASSWORD'),
        db: config.get<number>('REDIS_DB', 0),
      }),
    }),
    DrizzleModule,
  ],
  providers: [KeycloakClient, JwtVerifierService, AuthGuard, AccessTokenStrategy, RefreshTokenStrategy],
  exports: [AuthGuard, JwtVerifierService, AccessTokenStrategy, RefreshTokenStrategy],
})
export class GuardModule {}
