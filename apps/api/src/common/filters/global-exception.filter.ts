import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getCorrelationId } from '../correlation-id.storage';

export type GlobalErrorBody = {
  statusCode: number;
  message: string | string[];
  correlationId: string;
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const headerId = req.headers['x-correlation-id'];
    const correlationId =
      getCorrelationId() ??
      (typeof headerId === 'string' && headerId.trim().length > 0
        ? headerId.trim()
        : 'unknown');

    const path = req.originalUrl ?? req.url ?? '';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const m = (body as { message?: unknown }).message;
        if (typeof m === 'string') message = m;
        else if (Array.isArray(m) && m.every((x) => typeof x === 'string')) {
          message = m;
        } else if (m != null) message = String(m);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const payload: GlobalErrorBody = {
      statusCode: status,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
      path,
    };

    const logMsg =
      typeof message === 'string' ? message : message.join('; ');
    this.logger.error(
      `[${correlationId}] ${logMsg} — ${path} (${status})`,
      exception instanceof Error ? exception.stack : undefined,
    );

    res.status(status).json(payload);
  }
}
