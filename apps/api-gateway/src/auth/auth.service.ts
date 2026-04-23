import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'libs/redis';
import { PkceService } from './pkce';
import { KeycloakClient } from './keycloak';

@Injectable()
export class AuthService {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly scope: string;
  private readonly authUri: string;

  constructor(
    private readonly config: ConfigService,
    private readonly pkce: PkceService,
    private readonly keycloak: KeycloakClient,
    private readonly redis: RedisService,
  ) {
    this.clientId = this.config.get<string>('KEYCLOAK_CLIENT_ID') as string;
    this.redirectUri = this.config.get<string>('KEYCLOAK_REDIRECT_URI') as string;
    this.scope = this.config.get<string>('KEYCLOAK_SCOPE') as string;
    this.authUri = this.config.get<string>('KEYCLOAK_AUTH_URI') as string;
  }

  // Build authorization URL for Keycloak
  async buildAuthorizationUrl(): Promise<string> {
    const verifier = this.pkce.generateCodeVerifier();
    const challenge = this.pkce.generateCodeChallenge(verifier);
    const state = this.pkce.generateState();

    await this.redis.set(state, verifier, 60 * 15);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'login',
    });

    return `${this.authUri}?${params.toString()}`;
  }

  // Exchange code for tokens
  async exchangeCode(code: string, state: string) {
    const verifier = await this.redis.get(state);

    if (!verifier) {
      throw new UnauthorizedException('Invalid or expired state (possible CSRF)');
    }

    await this.redis.del(state);

    return this.keycloak.requestTokens({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code,
      code_verifier: verifier,
    });
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token required');
    }

    return this.keycloak.requestTokens({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken,
    });
  }

  // Logout from Keycloak
  async logout(refreshToken: string) {
    if (!refreshToken) return;

    await this.keycloak.logout(this.clientId, refreshToken);
  }
}
