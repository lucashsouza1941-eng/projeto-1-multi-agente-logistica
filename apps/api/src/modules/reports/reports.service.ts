import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string) {
    const where: { status?: ReportStatus } = {};
    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status as ReportStatus;
    }
    const rows = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { name: true } } },
    });
    return rows.map((r) => {
      const params = r.parameters as Record<string, unknown> | null;
      const content = r.content as Record<string, unknown> | null;
      const period = params && 'period' in params ? String(params.period) : '—';
      const summary = content && 'summary' in content ? String(content.summary) : undefined;
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        generatedBy: r.agent?.name ?? 'Gerador de Relatórios',
        period,
        summary,
      };
    });
  }

  async getById(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { agent: { select: { name: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');
    const params = report.parameters as Record<string, unknown> | null;
    const content = report.content as Record<string, unknown> | null;
    const period = params && 'period' in params ? String(params.period) : '—';
    const summary =
      content && 'summary' in content ? String(content.summary) : 'N/A';
    return {
      id: report.id,
      title: report.title,
      type: report.type,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      generatedBy: report.agent?.name ?? 'Gerador de Relatórios',
      period,
      summary,
      content: {
        sections: [{ title: 'Resumo', body: summary }],
        raw: report.content,
      },
    };
  }

  async create(body: {
    title: string;
    type: string;
    period?: string;
    parameters?: Record<string, unknown>;
  }) {
    let parameters: Prisma.InputJsonValue | undefined;
    if (body.parameters) {
      parameters = { ...body.parameters, period: body.period } as Prisma.InputJsonValue;
    } else if (body.period) {
      parameters = { period: body.period } as Prisma.InputJsonValue;
    }
    const report = await this.prisma.report.create({
      data: {
        title: body.title,
        type: body.type,
        status: 'PENDING',
        parameters,
      },
    });
    return {
      id: report.id,
      title: report.title,
      type: report.type,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    };
  }

  async regenerate(id: string) {
    const exists = await this.prisma.report.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Report not found');
    await this.prisma.report.update({
      where: { id },
      data: { status: 'GENERATING' },
    });
    return { id, status: 'PENDING', message: 'Regeneration queued' };
  }
}
