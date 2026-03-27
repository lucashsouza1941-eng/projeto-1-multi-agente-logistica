import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('Dashboard HTTP (integration)', () => {
  let app: INestApplication;
  let prismaMock: Record<string, unknown>;

  beforeAll(async () => {
    prismaMock = {
      email: {
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _avg: { confidence: 88.5 } }),
      },
      report: {
        count: vi.fn().mockResolvedValue(3),
      },
      agentLog: {
        aggregate: vi.fn().mockResolvedValue({ _avg: { durationMs: 1500 } }),
      },
      escalationTicket: {
        count: vi.fn().mockResolvedValue(2),
      },
      agent: {
        count: vi.fn().mockResolvedValue(1),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
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

  it('GET /dashboard/kpis retorna estrutura esperada', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/kpis?period=7d')
      .expect(200);

    expect(res.body).toMatchObject({
      emailsProcessed: 0,
      reportsGenerated: 3,
      ticketsEscalated: 2,
      agentsOnline: 1,
      emailsPending: 0,
      period: '7d',
    });
    expect(res.body).toHaveProperty('triageAccuracyPercent');
    expect(res.body).toHaveProperty('avgProcessingTimeMs');
    expect(res.body).toHaveProperty('emailsProcessedToday');
    expect(res.body).toHaveProperty('emailsProcessedWeek');
    expect(res.body).toHaveProperty('emailsProcessedMonth');

    expect(
      vi.mocked(prismaMock.email.count as ReturnType<typeof vi.fn>),
    ).toHaveBeenCalled();
  });
});
