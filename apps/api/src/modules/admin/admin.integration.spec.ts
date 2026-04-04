import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from '../auth/roles.guard';
import { ThrottlerUserGuard } from '../../common/guards/throttler-user.guard';
import { HttpMetricsService } from '../../common/metrics/http-metrics.service';
import { AdminController } from './admin.controller';

class JwtTestGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { id: string; role: 'user' | 'admin' };
    }>();
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }
    const token = auth.slice(7);
    if (token === 'admin-token') {
      req.user = { id: 'admin-1', role: 'admin' };
      return true;
    }
    if (token === 'user-token') {
      req.user = { id: 'user-1', role: 'user' };
      return true;
    }
    throw new UnauthorizedException('Unauthorized');
  }
}

describe('Admin HTTP (integration authz)', () => {
  let app: INestApplication;

  const triageQueue = {
    getJobs: vi.fn().mockResolvedValue([]),
    getJobCounts: vi
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    add: vi.fn().mockResolvedValue({ id: 'new-job-1' }),
  };
  const reportQueue = {
    getJobs: vi.fn().mockResolvedValue([]),
    getJobCounts: vi
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    add: vi.fn().mockResolvedValue({ id: 'new-job-2' }),
  };
  const escalationQueue = {
    getJobs: vi.fn().mockResolvedValue([]),
    getJobCounts: vi
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    add: vi.fn().mockResolvedValue({ id: 'new-job-3' }),
  };
  const dlqQueue = {
    getJobs: vi.fn().mockResolvedValue([]),
    getJobCounts: vi
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    getJob: vi.fn().mockResolvedValue({
      id: 'dlq-1',
      data: {
        sourceQueue: 'email-triage',
        jobName: 'process-email',
        data: { emailId: 'e1' },
        originalJobId: 'old-1',
      },
      remove: vi.fn().mockResolvedValue(undefined),
    }),
    obliterate: vi.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'auth', ttl: 60_000, limit: 10 },
          { name: 'llm', ttl: 60_000, limit: 5 },
          { name: 'jobs', ttl: 60_000, limit: 10 },
          { name: 'admin', ttl: 60_000, limit: 30 },
        ]),
      ],
      controllers: [AdminController],
      providers: [
        { provide: APP_GUARD, useClass: JwtTestGuard },
        RolesGuard,
        ThrottlerUserGuard,
        { provide: getQueueToken('email-triage'), useValue: triageQueue },
        { provide: getQueueToken('report-generation'), useValue: reportQueue },
        {
          provide: getQueueToken('escalation-processing'),
          useValue: escalationQueue,
        },
        { provide: getQueueToken('failed-jobs'), useValue: dlqQueue },
        {
          provide: HttpMetricsService,
          useValue: {
            getFivexxRateLastHour: () => ({ rate: 0, total: 0, errors5xx: 0 }),
            getAvgLatencyMsLast100Global: () => null,
            getAvgLatencyMsByRoute: () => ({}),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const routes = [
    { method: 'get' as const, path: '/admin/failed-jobs', ok: 200 },
    { method: 'get' as const, path: '/admin/metrics', ok: 200 },
    { method: 'post' as const, path: '/admin/failed-jobs/dlq-1/retry', ok: 201 },
    { method: 'delete' as const, path: '/admin/failed-jobs', ok: 200 },
  ];

  for (const r of routes) {
    it(`${r.method.toUpperCase()} ${r.path} -> 401 sem token`, async () => {
      await request(app.getHttpServer())[r.method](r.path).expect(401);
    });

    it(`${r.method.toUpperCase()} ${r.path} -> 403 token user comum`, async () => {
      await request(app.getHttpServer())
        [r.method](r.path)
        .set('authorization', 'Bearer user-token')
        .expect(403);
    });

    it(`${r.method.toUpperCase()} ${r.path} -> sucesso token admin`, async () => {
      await request(app.getHttpServer())
        [r.method](r.path)
        .set('authorization', 'Bearer admin-token')
        .expect(r.ok);
    });
  }
});
