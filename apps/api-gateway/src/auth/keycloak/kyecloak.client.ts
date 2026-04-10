import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeycloakClient {
  private readonly logger = new Logger(KeycloakClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get tokenUri() {
    return this.config.get<string>('KEYCLOAK_TOKEN_URI') as string;
  }

  private get logoutUri() {
    return this.config.get<string>('KEYCLOAK_LOGOUT_URI') as string;
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
}
