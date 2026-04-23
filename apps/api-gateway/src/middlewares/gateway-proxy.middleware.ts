import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiGatewayService } from '../api-gateway.service';
import { SERVICE_MAPPING } from '../gateway-services/gateway-services.module';
import { randomUUID } from 'crypto';
import { RpcContext } from 'libs/common/interfaces';

@Injectable()
export class GatewayProxyMiddleware implements NestMiddleware {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const url = req.originalUrl || req.url;
    const [pathname] = url.split('?');
    const urlParts = pathname.split('/').filter(Boolean);

    if (url.startsWith('/auth')) {
      return next();
    }

    const servicePrefix = urlParts[0];

    if (!servicePrefix || !SERVICE_MAPPING[servicePrefix]) {
      return next(new NotFoundException('Service not found'));
    }

    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    const context: RpcContext = {
      method: req.method.toUpperCase(),
      path: urlParts.slice(1).join('/'),
      body: req.body as Record<string, unknown>,
      query: req.query as Record<string, unknown>,
      params: urlParts.slice(2),
      requestId,
    };

    const pattern = `${context.method}.${urlParts[1]}`;

    try {
      const result = await this.apiGatewayService.routeRequest(servicePrefix, pattern, context);

      return res.status(result.status ?? 200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: result.timestamp,
        requestId,
      });
    } catch (err) {
      return next(err);
    }
  }
}
