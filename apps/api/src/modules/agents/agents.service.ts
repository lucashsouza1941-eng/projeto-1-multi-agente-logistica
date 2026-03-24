import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfDayUtc(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async list() {
    const dayStart = this.startOfDayUtc();
    const agents = await this.prisma.agent.findMany({ orderBy: { name: 'asc' } });
    const avgConf = await this.prisma.email.aggregate({
      _avg: { confidence: true },
    });
    const avgConfidence =
      avgConf._avg.confidence != null ? Math.round(avgConf._avg.confidence) : 91;
    const openTickets = await this.prisma.escalationTicket.count({
      where: { status: { in: ['NEW', 'ANALYZING', 'ESCALATED'] } },
    });
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    const reportsThisWeek = await this.prisma.report.count({
      where: { createdAt: { gte: weekStart } },
    });

    const results = [];
    for (const a of agents) {
      const processedToday = await this.prisma.agentLog.count({
        where: { agentId: a.id, createdAt: { gte: dayStart } },
      });
      const metrics: Record<string, number> = {
        processedToday,
        avgConfidence,
      };
      if (a.type === AgentType.REPORT) {
        metrics.reportsThisWeek = reportsThisWeek;
      }
      if (a.type === AgentType.ESCALATION) {
        metrics.openTickets = openTickets;
      }
      results.push({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        lastRunAt: a.lastRunAt ? a.lastRunAt.toISOString() : null,
        totalProcessed: a.totalProcessed,
        successRate: a.successRate,
        metrics,
      });
    }
    return results;
  }

  async getById(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');
    const dayStart = this.startOfDayUtc();
    const processedToday = await this.prisma.agentLog.count({
      where: { agentId: id, createdAt: { gte: dayStart } },
    });
    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      lastRunAt: agent.lastRunAt ? agent.lastRunAt.toISOString() : null,
      totalProcessed: agent.totalProcessed,
      successRate: agent.successRate,
      metrics: { processedToday },
    };
  }

  async getLogs(agentId: string, limit: number) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');
    const logs = await this.prisma.agentLog.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
    return logs.map((l) => ({
      id: l.id,
      agentId: l.agentId,
      action: l.action,
      durationMs: l.durationMs,
      success: l.success,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async updateConfig(id: string, config: Record<string, unknown>) {
    try {
      const agent = await this.prisma.agent.update({
        where: { id },
        data: { config: config as Prisma.InputJsonValue },
      });
      return { id: agent.id, config: agent.config, updated: true };
    } catch {
      throw new NotFoundException('Agent not found');
    }
  }

  async restart(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');
    return { id, status: 'restarting', message: 'Agent restart initiated' };
  }
}
