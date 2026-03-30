import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    let statusCode: number = HttpStatus.OK;

    console.log(response);
    return next.handle().pipe(
      map((data: unknown) => {
        // ✅ If microservice returned structured response
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'message' in data
        ) {
          const resData = data as {
            status: number;
            message: string;
            data?: unknown;
          };
          statusCode = resData.status || HttpStatus.OK;

          response.status(statusCode);

          return {
            success: true,
            status: statusCode,
            message: resData.message,
            data: resData.data ?? null,
            timestamp: new Date().toISOString(),
          };
        }

        // ✅ Fallback (normal response)
        response.status(HttpStatus.OK);

        return {
          success: true,
          statusCode: response.status(statusCode) || HttpStatus.OK,
          message: 'Success',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
