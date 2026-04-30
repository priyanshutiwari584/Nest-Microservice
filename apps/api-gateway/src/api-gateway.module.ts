import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ServicesModule } from './gateway-services/gateway-services.module';
import { GatewayProxyMiddleware } from './middlewares/gateway-proxy.middleware';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from 'libs/drizzle';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServicesModule,
    AuthModule,
    DrizzleModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GatewayProxyMiddleware).forRoutes('*');
  }
}
