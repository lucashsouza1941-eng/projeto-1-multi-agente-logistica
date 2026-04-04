import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

function prismaMock() {
  return {
    email: {
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _avg: { confidence: 90 } }),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([
        { category: 'URGENT', _count: { category: 2 } },
        { category: 'UNKNOWN', _count: { category: 1 } },
      ]),
    },
    report: { count: vi.fn().mockResolvedValue(0) },
    agentLog: {
      aggregate: vi.fn().mockResolvedValue({ _avg: { durationMs: 1000 } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    escalationTicket: { count: vi.fn().mockResolvedValue(0) },
    agent: { count: vi.fn().mockResolvedValue(1) },
  };
}

describe('DashboardService', () => {
  const testUserId = 'user_test';
  let prisma: ReturnType<typeof prismaMock>;
  let svc: DashboardService;

  beforeEach(() => {
    prisma = prismaMock();
    svc = new DashboardService(prisma as unknown as PrismaService);
  });

  it('getKpis com period=custom sem datas → BadRequest', async () => {
    await expect(svc.getKpis(testUserId, 'custom')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('getKpis com datas customizadas aplica filtro gte e lte', async () => {
    await svc.getKpis(testUserId, 'custom', '2024-06-01', '2024-06-30');
    expect(prisma.email.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: testUserId,
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        },
      }),
    );
  });

  it('getKpis com data inicial posterior à final → BadRequest', async () => {
    await expect(
      svc.getKpis(testUserId, 'custom', '2024-06-10', '2024-06-01'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getKpis com formato de data inválido → BadRequest', async () => {
    await expect(
      svc.getKpis(testUserId, 'custom', '01-06-2024', '2024-06-30'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getVolumeChart sem datas usa buckets por hora (24h)', async () => {
    const out = await svc.getVolumeChart(testUserId, 'hour');
    expect(out.granularity).toBe('hour');
    expect(out.data).toHaveLength(24);
    expect(prisma.email.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: testUserId,
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });

  it('getVolumeChart intervalo curto (≤2 dias) → granularidade hour', async () => {
    const out = await svc.getVolumeChart(
      testUserId,
      'day',
      '2024-06-01',
      '2024-06-02',
    );
    expect(out.granularity).toBe('hour');
    expect(out).toMatchObject({ startDate: '2024-06-01', endDate: '2024-06-02' });
  });

  it('getVolumeChart intervalo longo → granularidade day', async () => {
    const out = await svc.getVolumeChart(
      testUserId,
      'day',
      '2024-01-01',
      '2024-03-01',
    );
    expect(out.granularity).toBe('day');
    expect((out as { data: unknown[] }).data.length).toBeGreaterThan(1);
  });

  it('getVolumeChart com início após fim → BadRequest', async () => {
    await expect(
      svc.getVolumeChart(testUserId, 'day', '2024-06-10', '2024-06-01'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getCategoryDistribution inclui label para categorias conhecidas e fallback', async () => {
    const rows = await svc.getCategoryDistribution(testUserId);
    expect(prisma.email.groupBy).toHaveBeenCalled();
    const urgent = rows.find((r) => r.category === 'URGENT');
    const unknown = rows.find((r) => r.category === 'UNKNOWN');
    expect(urgent?.label).toBe('Urgente');
    expect(unknown?.label).toBe('UNKNOWN');
  });
});
