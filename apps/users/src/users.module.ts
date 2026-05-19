import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DrizzleModule } from 'libs/drizzle';
import { GuardModule } from 'libs/common/guard/gaurd.module';

@Module({
  imports: [DrizzleModule, GuardModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
