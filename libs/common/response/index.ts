import { HttpStatus } from '@nestjs/common';
import { SuccessResponse } from './sucess.response';

export const CreatedResponse = <T>(data: T, message = 'Created successfully') =>
  new SuccessResponse(HttpStatus.CREATED, message, data);

export const OkResponse = <T>(data: T, message = 'Success') => new SuccessResponse(HttpStatus.OK, message, data);
