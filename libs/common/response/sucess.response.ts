import { HttpStatus } from '@nestjs/common';
import { RpcResponse } from '../interfaces/rpc-response.interface';

export class SuccessResponse<T = unknown> implements RpcResponse<T> {
  readonly success = true;
  readonly timestamp: string;

  constructor(
    public readonly status: number = HttpStatus.OK,
    public readonly message: string = 'Success',
    public readonly data?: T,
  ) {
    this.timestamp = new Date().toISOString();
  }
}
