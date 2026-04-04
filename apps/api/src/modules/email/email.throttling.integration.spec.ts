import { getQueueToken } from '@nestjs/bullmq';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { ThrottlerUserGuard } from '../../common/guards/throttler-user.guard';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

let currentUserId = 'user-a';

class TestUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { id: string };
    }>();
    currentUserId = req.headers['x-test-user'] || 'user-a';
    req.user = { id: currentUserId };
    return true;
  }
}

describe('Email throttle HTTP (integration)', () => {
  let app: INestApplication;
  const mockQueue = { add: vi.fn().mockResolvedValue({ id: 'job-rl' }) };
  const prismaMock = {
    email: {
      findUnique: vi.fn().mockImplementation(async () => ({
        id: 'email-xyz',
        userId: currentUserId,
      })),
    },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'auth', ttl: 60_000, limit: 10 },
          { name: 'llm', ttl: 60_000, limit: 5 },
          { name: 'jobs', ttl: 60_000, limit: 10 },
          { name: 'admin', ttl: 60_000, limit: 30 },
        ]),
      ],
      controllers: [EmailController],
      providers: [
        EmailService,
        ThrottlerUserGuard,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken('email-triage'), useValue: mockQueue },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new TestUserGuard());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('6ª requisição consecutiva em rota LLM retorna 429', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/emails/email-xyz/process')
        .set('x-test-user', 'user-a')
        .expect(201);
    }

    const blocked = await request(app.getHttpServer())
      .post('/emails/email-xyz/process')
      .set('x-test-user', 'user-a')
      .expect(429);

    expect(String(blocked.body.message)).toMatch(/too many requests/i);
  });

  it('dois utilizadores não compartilham o mesmo contador', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/emails/email-xyz/process')
        .set('x-test-user', 'user-a')
        .expect(201);
    }

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/emails/email-xyz/process')
        .set('x-test-user', 'user-b')
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/emails/email-xyz/process')
      .set('x-test-user', 'user-a')
      .expect(429);
  });
});
