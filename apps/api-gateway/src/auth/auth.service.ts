import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'libs/redis';
import { PkceService } from './pkce';
import { KeycloakClient } from './keycloak';
import { DRIZZLE, users } from 'libs/drizzle';
import type { DrizzleDB } from 'libs/drizzle';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly scope: string;
  private readonly authUri: string;
  private readonly clientSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly pkce: PkceService,
    private readonly keycloak: KeycloakClient,
    private readonly redis: RedisService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {
    this.clientId = this.config.get<string>('KEYCLOAK_CLIENT_ID') as string;
    this.redirectUri = this.config.get<string>('KEYCLOAK_REDIRECT_URI') as string;
    this.scope = this.config.get<string>('KEYCLOAK_SCOPE') as string;
    this.authUri = this.config.get<string>('KEYCLOAK_AUTH_URI') as string;
    this.clientSecret = this.config.get<string>('KEYCLOAK_CLIENT_SECRET') as string;
  }

  private async saveUser(data: { access_token: string; refresh_token: string }) {
    const userInfo = await this.keycloak.getUserInfo(data.access_token);

    const user = await this.db
      .insert(users)
      .values({
        name: userInfo.name,
        email: userInfo.email,
        username: userInfo.preferred_username,
        kcId: userInfo.sub,
        refreshToken: data.refresh_token,
      })
      .onConflictDoUpdate({
        target: users.kcId,
        set: {
          name: userInfo.name,
          email: userInfo.email,
          username: userInfo.preferred_username,
          refreshToken: data.refresh_token,
        },
      })
      .returning()
      .then((res) => res[0]);

    this.redis.set(`user:${userInfo.sub}`, user, 60 * 60 * 24);
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
      // prompt: 'login',
    });

    return `${this.authUri}?${params.toString()}`;
  }

  // Exchange code for tokens
  async exchangeCode(code: string, state: string) {
    try {
      const verifier = await this.redis.get(state);

      if (!verifier) {
        throw new UnauthorizedException('Invalid or expired state');
      }

      await this.redis.del(state);

      const data = await this.keycloak.requestTokens({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
        code_verifier: verifier,
      });

      await this.saveUser({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Login with username/password (Resource Owner Password Credentials Grant)
  async login(username: string, password: string) {
    const data = await this.keycloak.requestTokens({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'openid profile email',
      username,
      password,
    });

    await this.saveUser({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    return data;
  }

  // Logout from Keycloak
  async logout(refreshToken: string, userKcId: string) {
    if (!refreshToken) throw new BadRequestException('Refresh token required for logout');

    await this.db.update(users).set({ refreshToken: '' }).where(eq(users.refreshToken, refreshToken));

    await this.keycloak.logout(this.clientId, this.clientSecret, refreshToken);

    await this.redis.del(`user:${userKcId}`);
  }
}
