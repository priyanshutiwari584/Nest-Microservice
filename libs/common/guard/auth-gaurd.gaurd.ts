import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokenStrategy, RefreshTokenStrategy } from '../strategy';
import { Response } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly accessTokenStrategy: AccessTokenStrategy,
    private readonly refreshTokenStrategy: RefreshTokenStrategy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request: any;
    let response: Response | null = null;

    if (context.getType() === 'http') {
      request = context.switchToHttp().getRequest();
      response = context.switchToHttp().getResponse();
    } else if (context.getType<'rpc'>() === 'rpc') {
      request = context.switchToRpc().getData();
    }

    const token: string = request?.headers?.authorization?.replace('Bearer ', '') || request?.token;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const user = await this.accessTokenStrategy.validate(token);

      request.user = user;
      return true;
    } catch {
      try {
        const { user, accessToken } = await this.refreshTokenStrategy.validate(request);

        request.user = user;

        // Send new tokens back to frontend via response headers
        if (response) {
          response.setHeader('X-New-Access-Token', accessToken);
          response.setHeader('Access-Control-Expose-Headers', 'X-New-Access-Token');
        }

        return true;
      } catch (err) {
        throw new UnauthorizedException(err?.message || 'Invalid or expired token');
      }
    }
  }
}
