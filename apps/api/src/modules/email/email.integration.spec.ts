import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailCategory, EmailPriority, EmailStatus } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PROCESS_EMAIL_JOB } from '../../queues/queue-jobs.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

describe('Email HTTP (integration)', () => {
  let app: INestApplication;
  const mockQueue = { add: vi.fn().mockResolvedValue({ id: 'job-99' }) };
  const prismaMock = {
    email: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        EmailService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken('email-triage'), useValue: mockQueue },
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

  it('GET /emails lista com paginação', async () => {
    prismaMock.email.count.mockResolvedValue(42);
    prismaMock.email.findMany.mockResolvedValue([
      {
        id: 'e1',
        from: 'a@b.com',
        subject: 'Test',
        body: 'Hello world',
        category: EmailCategory.ROUTINE,
        priority: EmailPriority.LOW,
        confidence: 90,
        status: EmailStatus.PENDING,
        createdAt: new Date(),
        agentDecision: null,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/emails?page=2&limit=10')
      .expect(200);

    expect(res.body.total).toBe(42);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(10);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('e1');
    expect(prismaMock.email.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it('POST /emails/:id/process enfileira job BullMQ', async () => {
    prismaMock.email.findUnique.mockResolvedValue({ id: 'email-xyz' });

    const res = await request(app.getHttpServer())
      .post('/emails/email-xyz/process')
      .expect(201);

    expect(res.body).toEqual({ queued: true, jobId: 'job-99' });
    expect(mockQueue.add).toHaveBeenCalledWith(
      PROCESS_EMAIL_JOB,
      { emailId: 'email-xyz' },
      expect.any(Object),
    );
  });
});
