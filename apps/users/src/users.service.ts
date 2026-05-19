import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NotFoundRpcException } from 'libs/common/exceptions';
import { OkResponse } from 'libs/common/response';
import { DRIZZLE, users } from 'libs/drizzle';
import type { DrizzleDB } from 'libs/drizzle';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll() {
    const userList = await this.db
      .select({
        name: users.name,
        username: users.username,
        email: users.email,
        kcId: users.kcId,
      })
      .from(users);

    return OkResponse(userList);
  }

  async findByUsername(username: string) {
    const user = await this.db
      .select({
        name: users.name,
        username: users.username,
        email: users.email,
        kcId: users.kcId,
      })
      .from(users)
      .where(eq(users.username, username))
      .then((res) => res[0] || null);

    if (!user) {
      throw new NotFoundRpcException('User not found');
    }

    return OkResponse(user);
  }
}
