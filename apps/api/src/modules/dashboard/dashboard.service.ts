import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getKpis(period: string) {
    const since = this.sinceForPeriod(period || '7d');
    const today = this.startOfDayUtc();
    const weekStart = this.startOfWeekUtc();
    const monthStart = this.startOfMonthUtc();

    const [
      emailsProcessedInPeriod,
      emailsProcessedToday,
      emailsProcessedWeek,
      emailsProcessedMonth,
      reportsInPeriod,
      triageAgg,
      avgLog,
      ticketsEscalated,
    ] = await Promise.all([
      this.prisma.email.count({ where: { createdAt: { gte: since } } }),
      this.prisma.email.count({ where: { createdAt: { gte: today } } }),
      this.prisma.email.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.email.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.report.count({
        where: { status: 'COMPLETED', createdAt: { gte: since } },
      }),
      this.prisma.email.aggregate({
        where: { status: 'TRIAGED' },
        _avg: { confidence: true },
      }),
      this.prisma.agentLog.aggregate({
        where: { success: true, durationMs: { not: null } },
        _avg: { durationMs: true },
      }),
      this.prisma.escalationTicket.count({
        where: { status: { in: ['NEW', 'ANALYZING', 'ESCALATED'] } },
      }),
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
      avgProcessingTimeMs,
      period: period || '7d',
    };
  }

  async getActivity(limit: number) {
    const logs = await this.prisma.agentLog.findMany({
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

  async getVolumeChart(granularity: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const emails = await this.prisma.email.findMany({
      where: { createdAt: { gte: since } },
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
    return { granularity, data: buckets };
  }

  async getCategoryDistribution() {
    const grouped = await this.prisma.email.groupBy({
      by: ['category'],
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
