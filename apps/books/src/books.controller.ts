import { Controller } from '@nestjs/common';
import { BooksService } from './books.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateBookDto } from './dto/book.dto';

@Controller()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @MessagePattern({ cmd: 'books.GET.hello' })
  getHello() {
    return this.booksService.getHello();
  }

  @MessagePattern({ cmd: 'books.GET.findAll' })
  findAll() {
    return this.booksService.findAll();
  }

  @MessagePattern({ cmd: 'books.POST.add' })
  add(@Payload('body') body: CreateBookDto) {
    return this.booksService.addBook(body);
  }

  @MessagePattern({ cmd: 'books.GET.getbookById' })
  getbookById(@Payload('params') params: number[]) {
    const index = params?.[0];
    return this.booksService.getbookById(index);
  }
}
