import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';

@Catch()
export class GlobalRpcExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // RpcException thrown by a microservice handler
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }

    // HttpException thrown directly inside a microservice handler
    // (e.g. a guard or pipe fired before the handler could wrap it)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string }).message ?? exception.message);

      return super.catch(
        new RpcException({ statusCode: status, message }),
        host,
      );
    }

    // Native Error (unhandled throw inside a handler)
    if (exception instanceof Error) {
      return super.catch(
        new RpcException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception.message,
        }),
        host,
      );
    }

    // Unknown / primitive — safe fallback
    return super.catch(
      new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
      host,
    );
  }
}
