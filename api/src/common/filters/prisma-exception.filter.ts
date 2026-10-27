import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

const STATUS_BY_CODE: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'Registro duplicado' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Referência inválida' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Registro não encontrado' },
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const mapped = STATUS_BY_CODE[exception.code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno',
    };
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(mapped.status)
      .json({ statusCode: mapped.status, message: mapped.message });
  }
}
