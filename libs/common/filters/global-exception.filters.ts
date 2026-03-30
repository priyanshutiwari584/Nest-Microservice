import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RpcErrorResponse } from '../interfaces';

interface SerializedRpcError {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const url = req.originalUrl || req.url;
    const requestId =
      (req.headers['x-request-id'] as string) ?? crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    // 1. HttpException must come BEFORE the plain-object check
    //    because HttpException IS an object with a 'message' property
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as { message?: string | string[]; error?: string };
        message = body.message ?? message;
        error = body.error;
      }
    }

    // 2. Serialized RpcException from microservice
    //    Arrives as plain object: { statusCode, message, error? }
    else if (this.isSerializedRpcError(exception)) {
      const obj = exception as Record<string, unknown>;

      // Unwrap nested shape if present
      const payload =
        typeof obj.response === 'object' && obj.response !== null
          ? (obj.response as SerializedRpcError)
          : (obj as SerializedRpcError);

      status = payload.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
      message = payload.message ?? message;
      error = payload.error;
    }

    // 3. "No handler" string thrown by NestJS TCP transport
    else if (
      typeof exception === 'string' &&
      exception.includes('There is no matching message handler')
    ) {
      status = HttpStatus.NOT_FOUND;
      message = `Cannot ${req.method} ${url}`;
    }

    // 4. Other plain strings
    else if (typeof exception === 'string') {
      status = HttpStatus.BAD_REQUEST;
      message = exception;
    }

    // 5. Native Error
    else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json(<RpcErrorResponse>{
      success: false,
      message,
      error: error ?? HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR',
      path: url,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // Type-guard: distinguishes a serialized RPC error from a random object
  private isSerializedRpcError(val: unknown): val is SerializedRpcError {
    if (typeof val !== 'object' || val === null) return false;

    const obj = val as Record<string, unknown>;

    // Flat shape: { statusCode, message } ← normal RpcException payload
    if (typeof obj.statusCode === 'number') return true;

    // Nested shape: { response: { statusCode, message } } ← double-wrapped
    if (
      typeof obj.response === 'object' &&
      obj.response !== null &&
      typeof (obj.response as Record<string, unknown>).statusCode === 'number'
    )
      return true;

    return false;
  }
}
