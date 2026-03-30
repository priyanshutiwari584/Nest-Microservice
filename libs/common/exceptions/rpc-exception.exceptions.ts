import { HttpStatus } from '@nestjs/common';
import { BaseRpcException } from './rpc-exception.base.exceptions';

export class BadRequestRpcException extends BaseRpcException {
  constructor(message: string | string[] = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, message, 'Bad Request');
  }
}

export class UnauthorizedRpcException extends BaseRpcException {
  constructor(message: string | string[] = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, message, 'Unauthorized');
  }
}

export class ForbiddenRpcException extends BaseRpcException {
  constructor(message: string | string[] = 'Forbidden') {
    super(HttpStatus.FORBIDDEN, message, 'Forbidden');
  }
}

export class NotFoundRpcException extends BaseRpcException {
  constructor(message: string | string[] = 'Not Found') {
    super(HttpStatus.NOT_FOUND, message, 'Not Found');
  }
}

export class ConflictRpcException extends BaseRpcException {
  constructor(message: string | string[] = 'Conflict') {
    super(HttpStatus.CONFLICT, message, 'Conflict');
  }
}

export class InternalServerErrorRpcException extends BaseRpcException {
  constructor(message: string | string[] = 'Internal Server Error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, 'Internal Server Error');
  }
}
