import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtVerifierService } from 'libs/common/jwt/jwt-service';
import { AuthGuard } from 'libs/common/guard/auth-gaurd.gaurd';
import { KeycloakClient } from 'apps/api-gateway/src/auth/keycloak';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [KeycloakClient, JwtVerifierService, AuthGuard],
  exports: [AuthGuard, JwtVerifierService],
})
export class GuardModule {}
