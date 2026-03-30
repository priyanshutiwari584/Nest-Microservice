import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ServicesModule } from './services/services.module';
import { GatewayProxyMiddleware } from './middlewares/gateway-proxy.middleware';

@Module({
  imports: [ServicesModule],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    console.log('Registering GatewayProxyMiddleware...');
    consumer.apply(GatewayProxyMiddleware).forRoutes('*');
  }
}
