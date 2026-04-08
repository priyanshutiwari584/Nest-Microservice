import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/book.dto';
import {
  ConflictRpcException,
  NotFoundRpcException,
} from 'libs/common/exceptions';
import { CreatedResponse, OkResponse } from 'libs/common/response';

@Injectable()
export class BooksService {
  private books: Array<CreateBookDto> = [];
  getHello() {
    return OkResponse('Hello from Books service');
  }

  findAll() {
    return OkResponse(this.books, 'Books fetched successfully');
  }

  addBook(book: CreateBookDto) {
    if (book.name.includes('hello')) {
      throw new ConflictRpcException('Title is not allowed');
    }
    this.books.push(book);
    return CreatedResponse(book, 'Book added successfully');
  }

  getbookById(id: number) {
    const book = this.books[id];
    if (!book) {
      throw new NotFoundRpcException('Book not found');
    }
    return OkResponse(book, 'Book fetched successfully');
  }
}
