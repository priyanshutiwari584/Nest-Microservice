import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { GlobalExceptionFilter } from 'libs/common/filters';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      return new BadRequestException(
        errors
          .map(err => Object.values(err.constraints || {}))
          .flat()
          .join(', '),
      );
    },
  });

  app.useGlobalPipes(pipe);
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
