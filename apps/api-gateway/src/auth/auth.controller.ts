import { Controller, Get, Post, Query, Req, Res, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from 'libs/common/guard';
import { CurrentUser } from 'libs/common/decorators';
import type { User } from 'libs/drizzle';

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

  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @HttpCode(HttpStatus.OK)
  async login(@Res() res: Response) {
    const url = await this.authService.buildAuthorizationUrl();
    return res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
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
  async webRefresh(@Req() req: Request, @Res() res: Response) {
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

  @UseGuards(AuthGuard)
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async webLogout(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await this.authService.logout(refreshToken, user.kcId);

    // Clear the HttpOnly cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });

    return res.json({ message: 'Logged out successfully' });
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request & { csrfToken?: () => string }) {
    return { csrfToken: req.csrfToken?.() ?? '' };
  }
}
