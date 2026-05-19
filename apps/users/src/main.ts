import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BadRequestRpcException } from 'libs/common/exceptions';
import { GlobalRpcExceptionFilter } from 'libs/common/filters';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UsersModule, {
    transport: Transport.TCP,
    options: { host: 'localhost', port: Number(process.env.USERS_PORT) || 5001 },
  });

  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const errorMessages = errors.map((err) => Object.values(err.constraints || {})).flat();

      return new BadRequestRpcException(errorMessages.join(', '));
    },
  });

  app.useGlobalPipes(pipe);
  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();

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
