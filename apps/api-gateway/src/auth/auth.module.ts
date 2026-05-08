import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PkceService } from './pkce';
import { KeycloakClient } from './keycloak';
import { GuardModule } from 'libs/common/guard/gaurd.module';

@Module({
  imports: [HttpModule, GuardModule],
  providers: [AuthService, PkceService, KeycloakClient],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
