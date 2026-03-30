import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/book.dto';
import { NotFoundRpcException } from 'libs/common/exceptions';

@Injectable()
export class BooksService {
  private books: Array<CreateBookDto> = [];
  getHello(): string {
    return 'Hello from Books service';
  }

  findAll(): Array<CreateBookDto> {
    return this.books;
  }

  addBook(book: CreateBookDto) {
    if (book.name.includes('hello')) {
      throw new NotFoundRpcException('Title is not allowed');
    }
    return this.books.push(book);
  }

  getbookById(id: number) {
    return this.books[id];
  }
}
