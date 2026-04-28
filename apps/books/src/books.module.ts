import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { GuardModule } from 'libs/common/guard/gaurd.module';

@Module({
  imports: [GuardModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
