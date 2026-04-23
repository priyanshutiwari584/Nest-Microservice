import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { GlobalExceptionFilter } from 'libs/common/filters';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const PORT = process.env.API_GATEWAY_PORT ?? 5000;

  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      return new BadRequestException(
        errors
          .map((err) => Object.values(err.constraints || {}))
          .flat()
          .join(','),
      );
    },
  });

  app.useGlobalPipes(pipe);
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(PORT, () => {
    console.log(`Application is running on: ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    app.close();
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    app.close();
  });
}
bootstrap();
