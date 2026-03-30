import { Module } from '@nestjs/common';
import {
  ClientsModule,
  Transport,
  ClientProviderOptions,
} from '@nestjs/microservices';

export const SERVICES: ClientProviderOptions[] = [
  {
    name: 'USER_SERVICE',
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3001 },
  },
  {
    name: 'BOOK_SERVICE',
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3002 },
  },
];

export const SERVICE_MAPPING: Record<string, string> = {
  users: 'USER_SERVICE',
  books: 'BOOK_SERVICE',
};

@Module({
  imports: [ClientsModule.register(SERVICES)],
  exports: [ClientsModule],
})
export class ServicesModule {}
