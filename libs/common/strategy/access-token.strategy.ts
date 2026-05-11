import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DRIZZLE, users } from 'libs/drizzle';
import type { DrizzleDB, User } from 'libs/drizzle';
import { RedisService } from 'libs/redis';
import { JwtVerifierService } from '../jwt';
import { eq } from 'drizzle-orm';

@Injectable()
export class AccessTokenStrategy {
  constructor(
    private readonly jwtVerifier: JwtVerifierService,
    private readonly redis: RedisService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async validate(token: string): Promise<User> {
    try {
      const decoded = await this.jwtVerifier.verifyToken(token);

      let user: User | null = await this.redis.get<User>(`user:${decoded.sub}`);

      if (!user) {
        user = await this.db
          .select()
          .from(users)
          .where(eq(users.kcId, decoded.sub))
          .then((res) => res[0] || null);

        if (user) {
          await this.redis.set(`user:${decoded.sub}`, user, 60 * 60 * 24);
        }
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (err) {
      throw new UnauthorizedException(err?.message || 'Invalid token');
    }
  }
}
