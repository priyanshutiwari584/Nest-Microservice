import { NestFactory } from '@nestjs/core';
import { BooksModule } from './books.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { GlobalRpcExceptionFilter } from 'libs/common/filters';
import { BadRequestRpcException } from 'libs/common/exceptions';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BooksModule,
    {
      transport: Transport.TCP,
      options: { host: 'localhost', port: 3002 },
    },
  );

  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const errorMessages = errors
        .map(err => Object.values(err.constraints || {}))
        .flat();

      return new BadRequestRpcException(errorMessages.join(', '));
    },
  });

  app.useGlobalPipes(pipe);
  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();
}
bootstrap();
