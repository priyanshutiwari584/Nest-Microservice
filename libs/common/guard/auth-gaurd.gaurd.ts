import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtVerifierService } from '../jwt/jwt-service';
import { RedisService } from 'libs/redis';
import { DRIZZLE, users } from 'libs/drizzle';
import type { DrizzleDB } from 'libs/drizzle';
import { eq } from 'drizzle-orm';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtVerifier: JwtVerifierService,
    private readonly redis: RedisService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();

    // Expect token from API Gateway
    const token = data?.headers?.authorization?.replace('Bearer ', '') || data?.token;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = await this.jwtVerifier.verifyToken(token);

      // attach user
      let user: any = null;

      user = await this.redis.get(`user:${decoded.sub}`);

      if (!user) {
        user = await this.db
          .select()
          .from(users)
          .where(eq(users.kcId, decoded.sub))
          .then((res) => res[0] || null);

        if (user) this.redis.set(`user:${decoded.sub}`, user, 60 * 60 * 24);
      }

      data.user = user;

      return true;
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }
}
