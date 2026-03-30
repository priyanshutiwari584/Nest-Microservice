import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('getHello')
  getHello(): string {
    return this.usersService.getHello();
  }

  @MessagePattern('findAll')
  findAll(): string {
    return this.usersService.findAll();
  }
}
