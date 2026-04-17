import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ServicesModule } from './gateway-services/gateway-services.module';
import { GatewayProxyMiddleware } from './middlewares/gateway-proxy.middleware';
import { RedisModule } from 'libs/redis';
import 'dotenv/config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServicesModule,
    RedisModule.forRoot({
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT!) ?? 6379,
      db: 0,
      keyPrefix: 'api-gateway',
    }),
    AuthModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GatewayProxyMiddleware).forRoutes('*');
  }
}
