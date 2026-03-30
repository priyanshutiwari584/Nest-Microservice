import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getHello(): string {
    return 'Hello World! from Users App';
  }

  findAll(): string {
    return 'All users from Users App';
  }
}
