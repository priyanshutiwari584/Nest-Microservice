import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PkceService } from './pkce';
import { KeycloakClient } from './keycloak';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from 'libs/redis';

@Module({
  imports: [
    HttpModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        host: config.get<string>('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        password: config.get<string>('REDIS_PASSWORD'),
        db: config.get<number>('REDIS_DB', 0),
      }),
    }),
  ],
  providers: [AuthService, PkceService, KeycloakClient],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
