import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UsersModule, {
    transport: Transport.TCP,
    options: { host: 'localhost', port: Number(process.env.USERS_PORT) || 5001 },
  });
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
