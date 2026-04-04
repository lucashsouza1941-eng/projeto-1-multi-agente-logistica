import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { HttpMetricsService } from './http-metrics.service';

function normalizePath(path: string): string {
  return path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: HttpMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    if (req.method === 'OPTIONS') {
      return next.handle();
    }
    const path = req.path || '/';
    const routeKey = `${req.method} ${normalizePath(path)}`;
    const started = Date.now();
    let recorded = false;
    const record = (): void => {
      if (recorded) return;
      recorded = true;
      const latencyMs = Date.now() - started;
      const status = res.statusCode || 500;
      this.metrics.recordRequest(routeKey, status, latencyMs);
    };
    res.once('finish', record);
    res.once('close', record);
    return next.handle();
  }
}
