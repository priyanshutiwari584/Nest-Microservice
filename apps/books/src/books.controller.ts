import { Controller } from '@nestjs/common';
import { BooksService } from './books.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateBookDto } from './dto/book.dto';
import { CreatedResponse, OkResponse } from 'libs/common/response';

@Controller()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @MessagePattern({ cmd: 'books.GET.hello' })
  getHello(): string {
    return this.booksService.getHello();
  }

  @MessagePattern({ cmd: 'books.GET.findAll' })
  findAll() {
    return OkResponse(
      this.booksService.findAll(),
      'Books fetched successfully',
    );
  }

  @MessagePattern({ cmd: 'books.POST.add' })
  add(@Payload('body') body: CreateBookDto) {
    const book = this.booksService.addBook(body);
    return CreatedResponse(book, 'Book added successfully');
  }

  @MessagePattern({ cmd: 'books.GET.getbookById' })
  getbookById(@Payload() { params }: { params: unknown[] }) {
    const index = params?.[0] as number;
    return this.booksService.getbookById(index);
  }
}
