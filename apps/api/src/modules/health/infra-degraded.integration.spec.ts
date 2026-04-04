import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { HealthCheckService } from './health-check.service';

const ctx = vi.hoisted(() => ({
  redisDown: false,
}));

vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(() =>
      ctx.redisDown
        ? Promise.reject(new Error('ECONNREFUSED'))
        : Promise.resolve(),
    ),
    ping: vi.fn(() => Promise.resolve('PONG')),
    quit: vi.fn(() => Promise.resolve()),
  })),
}));

describe('Infra degradada (integration)', () => {
  describe('HealthCheckService', () => {
    let health: HealthCheckService;
    const prismaMock = {
      $queryRaw: vi.fn(),
    };

    beforeEach(async () => {
      ctx.redisDown = false;
      // Tagged template: $queryRaw`SELECT 1` — must resolve or DB is marked down and status becomes "down".
      prismaMock.$queryRaw.mockImplementation(
        (_strings: TemplateStringsArray, ..._values: unknown[]) =>
          Promise.resolve(1),
      );
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          HealthCheckService,
          { provide: PrismaService, useValue: prismaMock },
        ],
      }).compile();
      health = moduleRef.get(HealthCheckService);
    });

    afterEach(() => {
      prismaMock.$queryRaw.mockClear();
    });

    it('Redis indisponível → degraded, redis down', async () => {
      ctx.redisDown = true;
      const res = await health.check();
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      expect(res.checks).toEqual({ db: 'ok', redis: 'down' });
      expect(res.status).toBe('degraded');
    });

    it('DB indisponível → degraded, db down', async () => {
      prismaMock.$queryRaw.mockImplementation(
        (_strings: TemplateStringsArray, ..._values: unknown[]) =>
          Promise.reject(new Error('connection timeout')),
      );
      const res = await health.check();
      expect(res.status).toBe('degraded');
      expect(res.checks.db).toBe('down');
      expect(res.checks.redis).toBe('ok');
    });
  });

  describe('EmailService', () => {
    let emails: EmailService;
    const prismaEmail = {
      email: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    const queueMock = { add: vi.fn() };

    beforeEach(async () => {
      prismaEmail.email.count.mockResolvedValue(0);
      prismaEmail.email.findMany.mockResolvedValue([]);
      prismaEmail.email.findUnique.mockResolvedValue({
        id: 'e1',
        userId: 'u1',
      });
      queueMock.add.mockResolvedValue({ id: 'jq1' });
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: PrismaService, useValue: prismaEmail },
          { provide: getQueueToken('email-triage'), useValue: queueMock },
        ],
      }).compile();
      emails = moduleRef.get(EmailService);
    });

    it('lista funciona sem acesso à fila (só Prisma)', async () => {
      const res = await emails.list('u1', 1, 20);
      expect(res.total).toBe(0);
      expect(queueMock.add).not.toHaveBeenCalled();
    });

    it('lista → 503 quando DB falha, mensagem segura', async () => {
      prismaEmail.email.count.mockRejectedValue(new Error('secret internal pg'));
      try {
        await emails.list('u1', 1, 20);
        expect.fail('deveria lançar');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceUnavailableException);
        expect(JSON.stringify(e)).not.toContain('secret internal');
      }
    });

    it('enqueue process → 503 quando fila indisponível', async () => {
      queueMock.add.mockRejectedValue(new Error('Redis connection refused'));
      await expect(emails.enqueueProcess('u1', 'e1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
