import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  CREATE_ESCALATION_TICKET_JOB,
  CreateEscalationTicketPayload,
} from './queue-jobs.constants';

@Processor('escalation-processing')
export class EscalationProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessingProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CreateEscalationTicketPayload>): Promise<{ ticketId: string }> {
    if (job.name !== CREATE_ESCALATION_TICKET_JOB) {
      this.logger.warn(`Ignorando job com nome "${job.name}"`);
      return { ticketId: '' };
    }
    const { emailId, subject, description, priority, userId } = job.data ?? {};
    if (!emailId || !subject || !description || !priority) {
      throw new Error('Payload inválido para criação de ticket de escalação');
    }

    const existing = await this.prisma.escalationTicket.findUnique({
      where: { emailId },
      select: { id: true },
    });
    if (existing) {
      return { ticketId: existing.id };
    }

    const ticket = await this.prisma.escalationTicket.create({
      data: {
        subject,
        description,
        priority,
        source: 'email-triage-pipeline',
        ...(userId ? { userId } : {}),
        emailId,
        aiDecisionLog: [
          {
            step: 'auto-escalation',
            by: 'EscalationProcessingProcessor',
            at: new Date().toISOString(),
          },
        ],
        timeline: [
          {
            type: 'created',
            at: new Date().toISOString(),
            by: 'EscalationProcessingProcessor',
          },
        ],
      },
      select: { id: true },
    });

    return { ticketId: ticket.id };
  }
}
