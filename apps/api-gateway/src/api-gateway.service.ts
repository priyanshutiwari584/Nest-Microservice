import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICE_MAPPING } from './gateway-services/gateway-services.module';
import { firstValueFrom } from 'rxjs';
import { RpcContext, RpcResponse } from 'libs/common/interfaces';

@Injectable()
export class ApiGatewayService {
  constructor(private moduleRef: ModuleRef) {}

  async routeRequest(servicePrefix: string, pattern: string, context: RpcContext): Promise<RpcResponse> {
    const serviceName = SERVICE_MAPPING[servicePrefix];
    if (!serviceName) {
      throw new NotFoundException(`No service for prefix "${servicePrefix}"`);
    }

    const client = this.moduleRef.get<ClientProxy>(serviceName, {
      strict: false,
    });
    if (!client) {
      throw new InternalServerErrorException(`Client "${serviceName}" not resolved`);
    }

    const messagePattern = { cmd: `${servicePrefix}.${pattern}` };

    return firstValueFrom(client.send<RpcResponse>(messagePattern, context));
  }
}
