import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private startOfDayUtc(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private startOfWeekUtc(): Date {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private startOfMonthUtc(): Date {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private sinceForPeriod(period: string): Date {
    const today = this.startOfDayUtc();
    const weekStart = this.startOfWeekUtc();
    const monthStart = this.startOfMonthUtc();
    if (period === 'today') return today;
    if (period === '30d') return monthStart;
    if (period === 'custom') return weekStart;
    return weekStart;
  }

  /** Aceita apenas YYYY-MM-DD (UTC). */
  private parseDay(iso: string, endOfDay: boolean): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      throw new BadRequestException('Use datas no formato YYYY-MM-DD.');
    }
    const d = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Data inválida.');
    }
    if (endOfDay) {
      d.setUTCHours(23, 59, 59, 999);
    }
    return d;
  }

  private resolveKpiRange(
    period: string,
    startDate?: string,
    endDate?: string,
  ): { since: Date; until?: Date } {
    if (startDate && endDate) {
      const since = this.parseDay(startDate, false);
      const until = this.parseDay(endDate, true);
      if (since.getTime() > until.getTime()) {
        throw new BadRequestException(
          'A data inicial deve ser anterior ou igual à data final.',
        );
      }
      return { since, until };
    }
    if ((period || '').toLowerCase() === 'custom') {
      throw new BadRequestException(
        'Para período personalizado, informe startDate e endDate (YYYY-MM-DD).',
      );
    }
    return { since: this.sinceForPeriod(period || '7d'), until: undefined };
  }

  async getKpis(
    userId: string,
    period: string,
    startDate?: string,
    endDate?: string,
  ) {
    const { since, until } = this.resolveKpiRange(
      period || '7d',
      startDate,
      endDate,
    );
    const today = this.startOfDayUtc();
    const weekStart = this.startOfWeekUtc();
    const monthStart = this.startOfMonthUtc();

    const createdInPeriod =
      until != null
        ? { gte: since, lte: until }
        : { gte: since };

    const [
      emailsProcessedInPeriod,
      emailsProcessedToday,
      emailsProcessedWeek,
      emailsProcessedMonth,
      reportsInPeriod,
      triageAgg,
      avgLog,
      ticketsEscalated,
      agentsOnline,
      emailsPending,
    ] = await Promise.all([
      this.prisma.email.count({
        where: { userId, createdAt: createdInPeriod },
      }),
      this.prisma.email.count({
        where: { userId, createdAt: { gte: today } },
      }),
      this.prisma.email.count({
        where: { userId, createdAt: { gte: weekStart } },
      }),
      this.prisma.email.count({
        where: { userId, createdAt: { gte: monthStart } },
      }),
      this.prisma.report.count({
        where: {
          userId,
          status: 'COMPLETED',
          createdAt: createdInPeriod,
        },
      }),
      this.prisma.email.aggregate({
        where: { userId, status: 'TRIAGED' },
        _avg: { confidence: true },
      }),
      this.prisma.agentLog.aggregate({
        where: {
          success: true,
          durationMs: { not: null },
          agent: { userId },
        },
        _avg: { durationMs: true },
      }),
      this.prisma.escalationTicket.count({
        where: {
          userId,
          status: { in: ['NEW', 'ANALYZING', 'ESCALATED'] },
        },
      }),
      this.prisma.agent.count({
        where: {
          userId,
          status: { in: ['ONLINE', 'PROCESSING'] },
        },
      }),
      this.prisma.email.count({ where: { userId, status: 'PENDING' } }),
    ]);

    const triageAccuracyPercent =
      triageAgg._avg.confidence != null
        ? Math.round(triageAgg._avg.confidence * 10) / 10
        : 0;
    const avgProcessingTimeMs =
      avgLog._avg.durationMs != null ? Math.round(avgLog._avg.durationMs) : 1200;

    return {
      emailsProcessed: emailsProcessedInPeriod,
      emailsProcessedToday,
      emailsProcessedWeek,
      emailsProcessedMonth,
      triageAccuracyPercent,
      reportsGenerated: reportsInPeriod,
      ticketsEscalated,
      agentsOnline,
      emailsPending,
      avgProcessingTimeMs,
      period: period || '7d',
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    };
  }

  async getActivity(userId: string, limit: number) {
    const logs = await this.prisma.agentLog.findMany({
      where: { agent: { userId } },
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { name: true } } },
    });
    return logs.map((l) => ({
      id: l.id,
      agentName: l.agent?.name ?? 'Agente',
      action: l.action,
      timestamp: l.createdAt.toISOString(),
      status: l.success ? 'success' : 'error',
    }));
  }

  async getVolumeChart(
    userId: string,
    granularity: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (startDate && endDate) {
      const since = this.parseDay(startDate, false);
      const until = this.parseDay(endDate, true);
      if (since.getTime() > until.getTime()) {
        throw new BadRequestException('Intervalo de volume inválido.');
      }
      const emails = await this.prisma.email.findMany({
        where: { userId, createdAt: { gte: since, lte: until } },
        select: { createdAt: true },
      });
      const rangeMs = until.getTime() - since.getTime();
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

      if (rangeMs <= twoDaysMs) {
        const numHours = Math.min(
          72,
          Math.max(1, Math.ceil(rangeMs / (60 * 60 * 1000)) + 1),
        );
        const data = Array.from({ length: numHours }, (_, i) => ({
          label: `h${i}`,
          value: 0,
        }));
        for (const e of emails) {
          const idx = Math.floor(
            (e.createdAt.getTime() - since.getTime()) / (60 * 60 * 1000),
          );
          if (idx >= 0 && idx < numHours) {
            data[idx].value += 1;
          }
        }
        return { granularity: 'hour', data, startDate, endDate };
      }

      const numDays = Math.min(
        90,
        Math.ceil(rangeMs / (24 * 60 * 60 * 1000)) + 1,
      );
      const data = Array.from({ length: numDays }, (_, i) => {
        const day = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
        return {
          label: day.toISOString().slice(0, 10),
          value: 0,
        };
      });
      for (const e of emails) {
        const idx = Math.floor(
          (e.createdAt.getTime() - since.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (idx >= 0 && idx < numDays) {
          data[idx].value += 1;
        }
      }
      return { granularity: 'day', data, startDate, endDate };
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const emails = await this.prisma.email.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      label: `${i}h`,
      value: 0,
    }));
    for (const e of emails) {
      const h = e.createdAt.getUTCHours();
      if (h >= 0 && h < 24) buckets[h].value += 1;
    }
    return { granularity: granularity || 'hour', data: buckets };
  }

  async getCategoryDistribution(userId: string) {
    const grouped = await this.prisma.email.groupBy({
      by: ['category'],
      where: { userId },
      _count: { category: true },
    });
    const labels: Record<string, string> = {
      URGENT: 'Urgente',
      ROUTINE: 'Rotina',
      SPAM: 'Spam',
      ACTION_REQUIRED: 'Ação Requerida',
    };
    return grouped.map((g) => ({
      category: g.category,
      label: labels[g.category] ?? g.category,
      count: g._count.category,
    }));
  }
}
