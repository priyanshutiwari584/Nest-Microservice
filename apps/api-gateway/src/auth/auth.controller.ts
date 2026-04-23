import { Controller, Get, Post, Query, Req, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import express from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

/**
 * Cookie configuration for the refresh token.
 * HttpOnly    — JS cannot read it (XSS protection)
 * Secure      — HTTPS only in production
 * SameSite    — lax prevents CSRF on top-level navigations
 * Path        — scoped so cookie is only sent to /auth routes
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('login')
  @HttpCode(HttpStatus.OK)
  async login(@Res() res: express.Response) {
    const url = await this.authService.buildAuthorizationUrl();
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Query('error') error: string, @Res() res: express.Response) {
    if (error) {
      this.logger.warn(`Keycloak callback error: ${error}`);
      return res.status(HttpStatus.UNAUTHORIZED).json({ error });
    }

    if (!code || !state) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing code or state' });
    }

    const tokens = await this.authService.exchangeCode(code, state);

    // Refresh token → HttpOnly cookie scoped to /auth routes
    res.cookie(REFRESH_COOKIE_NAME, tokens.refresh_token, REFRESH_COOKIE_OPTIONS);

    return res.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async webRefresh(@Req() req: express.Request, @Res() res: express.Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'No refresh token cookie found' });
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Rotate the refresh token cookie
    res.cookie(REFRESH_COOKIE_NAME, tokens.refresh_token, REFRESH_COOKIE_OPTIONS);

    return res.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
    });
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async webLogout(@Req() req: express.Request, @Res() res: express.Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await this.authService.logout(refreshToken);

    // Clear the HttpOnly cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });

    return res.json({ message: 'Logged out successfully' });
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: express.Request & { csrfToken?: () => string }) {
    return { csrfToken: req.csrfToken?.() ?? '' };
  }
}
