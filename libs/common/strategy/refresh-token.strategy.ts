import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from 'libs/drizzle';
import { RedisService } from 'libs/redis';
import { Request } from 'express';
import { RpcContext } from '../interfaces';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RefreshTokenStrategy {
  private readonly tokenUri: string;
  private readonly introspectUri: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly http: HttpService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.tokenUri = this.config.get<string>('KEYCLOAK_TOKEN_URI') as string;
    this.introspectUri = this.config.get<string>('KEYCLOAK_INTROSPECT_URI') as string;
    this.clientId = this.config.get<string>('KEYCLOAK_CLIENT_ID') as string;
    this.clientSecret = this.config.get<string>('KEYCLOAK_CLIENT_SECRET') as string;
  }

  async validate(contextData: Request | RpcContext): Promise<{ user: User; accessToken: string }> {
    const cookie = contextData?.headers?.cookie?.split(';').find((c) => c.trim().startsWith('refresh_token='));

    if (!cookie) throw new UnauthorizedException('No refresh token provided');

    const refreshToken = cookie.split('=')[1].trim();

    const { data } = await firstValueFrom(
      this.http.post(
        this.introspectUri,
        new URLSearchParams({
          token: refreshToken,
          token_type_hint: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      ),
    );

    if (!data.active) throw new UnauthorizedException('Invalid or expired refresh token');

    const { data: response } = await firstValueFrom(
      this.http.post(
        this.tokenUri,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    const user = await this.redis.get<User>(`user:${data.sub}`);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user, accessToken: response.access_token };
  }
}
