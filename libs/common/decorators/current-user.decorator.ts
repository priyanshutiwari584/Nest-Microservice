import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'libs/drizzle';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext): User => {
  const rpcContext = ctx.switchToRpc().getData();
  const user = rpcContext?.user;

  return data ? (user?.[data] as User) : (user as User);
});
