import { InjectQueue } from '@nestjs/bullmq';
import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EmailCategory, EmailPriority, EmailStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { assertResourceOwned } from '../../common/ownership/assert-resource-owner';
import { PROCESS_EMAIL_JOB } from '../../queues/queue-jobs.constants';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @InjectQueue('email-triage') private readonly emailTriageQueue: Queue,
  ) {}

  private actionLabel(status: EmailStatus): string {
    const map: Partial<Record<EmailStatus, string>> = {
      PENDING: 'Pendente',
      TRIAGED: 'Triado',
      ESCALATED: 'Escalonado',
      RESOLVED: 'Resolvido',
    };
    return map[status] ?? String(status);
  }

  private toDto(e: {
    id: string;
    from: string;
    subject: string;
    body: string;
    category: EmailCategory;
    priority: EmailPriority;
    confidence: number;
    status: EmailStatus;
    createdAt: Date;
    agentDecision: unknown;
  }) {
    let reasoning = 'Classificado pelo agente de triagem.';
    if (e.agentDecision && typeof e.agentDecision === 'object' && e.agentDecision !== null) {
      const ad = e.agentDecision as { reasoning?: unknown };
      if ('reasoning' in ad && ad.reasoning != null) reasoning = String(ad.reasoning);
    }
    return {
      id: e.id,
      from: e.from,
      fromEmail: e.from,
      subject: e.subject,
      category: e.category,
      priority: e.priority,
      confidence: e.confidence,
      actionTaken: this.actionLabel(e.status),
      date: e.createdAt.toISOString(),
      preview: e.body.length > 200 ? `${e.body.slice(0, 200)}...` : e.body,
      aiReasoning: reasoning,
    };
  }

  async list(
    userId: string,
    page: number,
    limit: number,
    category?: string,
    _sort?: string,
  ) {
    const where: { category?: EmailCategory; userId: string } = { userId };
    if (category && category !== 'all' && Object.values(EmailCategory).includes(category as EmailCategory)) {
      where.category = category as EmailCategory;
    }
    try {
      const [total, rows] = await Promise.all([
        this.prisma.email.count({ where }),
        this.prisma.email.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);
      return {
        data: rows.map((row) => this.toDto(row)),
        total,
        page,
        limit,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Serviço de dados temporariamente indisponível. Tente mais tarde.',
      );
    }
  }

  async getById(userId: string, id: string) {
    const email = await this.prisma.email.findUnique({ where: { id } });
    if (!email) throw new NotFoundException('Email not found');
    assertResourceOwned(email.userId, userId);
    return this.toDto(email);
  }

  async enqueueProcess(userId: string, id: string) {
    const exists = await this.prisma.email.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Email not found');
    assertResourceOwned(exists.userId, userId);
    try {
      const job = await this.emailTriageQueue.add(
        PROCESS_EMAIL_JOB,
        { emailId: id },
        {
          attempts: 3,
          removeOnComplete: 50,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
      return { queued: true, jobId: String(job.id) };
    } catch {
      throw new ServiceUnavailableException(
        'Fila de processamento indisponível. Tente novamente em instantes.',
      );
    }
  }

  async reclassify(
    userId: string,
    id: string,
    body: { category: EmailCategory; priority: EmailPriority },
  ) {
    if (!Object.values(EmailCategory).includes(body.category)) {
      throw new NotFoundException('Invalid category');
    }
    if (!Object.values(EmailPriority).includes(body.priority)) {
      throw new NotFoundException('Invalid priority');
    }
    const current = await this.prisma.email.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Email not found');
    assertResourceOwned(current.userId, userId);
    const updated = await this.prisma.email.update({
      where: { id },
      data: {
        category: body.category,
        priority: body.priority,
        status: 'TRIAGED',
      },
    });
    return {
      id: updated.id,
      category: updated.category,
      priority: updated.priority,
      updated: true,
    };
  }

  async bulkAction(
    userId: string,
    ids: string[],
    action: 'approve' | 'reject' | 'reclassify',
  ) {
    const emails = await this.prisma.email.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true },
    });
    if (emails.length !== ids.length) {
      throw new NotFoundException('Um ou mais e-mails não foram encontrados');
    }
    for (const e of emails) {
      assertResourceOwned(e.userId, userId);
    }
    if (action === 'approve' || action === 'reclassify') {
      await this.prisma.email.updateMany({
        where: { id: { in: ids }, userId },
        data: { status: 'TRIAGED' },
      });
    }
    if (action === 'reject') {
      await this.prisma.email.updateMany({
        where: { id: { in: ids }, userId },
        data: { status: 'RESOLVED' },
      });
    }
    return { processed: ids.length, action };
  }
}
