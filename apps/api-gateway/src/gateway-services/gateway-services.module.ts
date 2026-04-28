import { Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import 'dotenv/config';

export const SERVICE_MAPPING: Record<string, string> = {
  users: 'USER_SERVICE',
  books: 'BOOK_SERVICE',
};

export const SERVICES: ClientProviderOptions[] = [
  {
    name: SERVICE_MAPPING.users,
    transport: Transport.TCP,
    options: { host: 'localhost', port: Number(process.env.USERS_PORT) || 5001 },
  },
  {
    name: SERVICE_MAPPING.books,
    transport: Transport.TCP,
    options: { host: 'localhost', port: Number(process.env.BOOKS_PORT) || 5002 },
  },
];

@Module({
  imports: [ClientsModule.register(SERVICES)],
  exports: [ClientsModule],
})
export class ServicesModule {}
