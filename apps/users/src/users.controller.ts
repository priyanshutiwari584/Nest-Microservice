import { Controller, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthGuard } from 'libs/common/guard';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @MessagePattern({ cmd: 'users.GET.all' })
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @MessagePattern({ cmd: 'users.GET.findByUsername' })
  async findByUsername(@Payload('params') params: string[]) {
    const [username] = params;
    return this.usersService.findByUsername(username);
  }
}
