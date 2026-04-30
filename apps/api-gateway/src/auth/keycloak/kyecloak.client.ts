import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'libs/redis/redis.service';
import { firstValueFrom } from 'rxjs';

type User = {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  preferred_username: string;
  given_name: string;
  family_name: string;
};

@Injectable()
export class KeycloakClient {
  private readonly logger = new Logger(KeycloakClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private get tokenUri() {
    return this.config.get<string>('KEYCLOAK_TOKEN_URI') as string;
  }

  private get logoutUri() {
    return this.config.get<string>('KEYCLOAK_LOGOUT_URI') as string;
  }

  private get userInfoUri() {
    return this.config.get<string>('KEYCLOAK_USERINFO_URI') as string;
  }

  async requestTokens(params: Record<string, string>) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(this.tokenUri, new URLSearchParams(params).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
      return data;
    } catch (err) {
      const message = err?.response?.data?.error_description || err?.message;

      this.logger.error('Token request failed', message);
      throw new UnauthorizedException(`Token request failed: ${message}`);
    }
  }

  async logout(clientId: string, refreshToken: string) {
    try {
      await firstValueFrom(
        this.http.post(
          this.logoutUri,
          new URLSearchParams({
            client_id: clientId,
            refresh_token: refreshToken,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
    } catch (err) {
      this.logger.warn('Keycloak logout failed', err?.message);
    }
  }

  async getUserInfo(accessToken: string): Promise<User> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(this.userInfoUri, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return data as User;
    } catch (error) {
      this.logger.error('Failed to fetch user info', error?.message);
      throw new UnauthorizedException('Failed to fetch user info');
    }
  }
}
