import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisModule } from 'libs/redis';
import { PkceService } from './pkce';
import { KeycloakClient } from './keycloak';

@Module({
  imports: [HttpModule, RedisModule],
  providers: [AuthService, PkceService, KeycloakClient],
  controllers: [AuthController],
})
export class AuthModule {}
