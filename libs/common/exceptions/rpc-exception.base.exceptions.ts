import { RpcException } from '@nestjs/microservices';

export class BaseRpcException extends RpcException {
  constructor(statusCode: number, message: string | string[], error?: string) {
    super({
      statusCode,
      message,
      error,
    });
  }
}
