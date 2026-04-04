import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, QueueEvents, UnrecoverableError } from 'bullmq';
import {
  AgentType,
  EmailPriority,
  EmailStatus,
  Prisma,
} from '@prisma/client';
import {
  CREATE_ESCALATION_TICKET_JOB,
  GENERATE_REPORT_FROM_EMAIL_JOB,
  PROCESS_EMAIL_JOB,
  ProcessEmailPayload,
} from '../queues/queue-jobs.constants';
import { TriageAgentService } from '../agents/triage-agent.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('email-triage')
export class EmailTriageProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(EmailTriageProcessor.name);
  private readonly reportQueueEvents: QueueEvents;

  constructor(
    private readonly prisma: PrismaService,
    private readonly triageAgent: TriageAgentService,
    private readonly config: ConfigService,
    @InjectQueue('report-generation')
    private readonly reportQueue: Queue,
    @InjectQueue('escalation-processing')
    private readonly escalationQueue: Queue,
  ) {
    super();
    const url =
      this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.reportQueueEvents = new QueueEvents('report-generation', {
      connection: { url },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.reportQueueEvents.close();
  }

  async process(job: Job<ProcessEmailPayload>): Promise<void> {
    if (job.name !== PROCESS_EMAIL_JOB) {
      this.logger.warn(`Ignorando job com nome "${job.name}"`);
      return;
    }

    const emailId = job.data?.emailId;
    if (!emailId) {
      this.logger.error('Job sem emailId');
      throw new UnrecoverableError('emailId obrigatório');
    }

    const emailRow = await this.prisma.email.findUnique({
      where: { id: emailId },
      select: { id: true, userId: true },
    });
    if (!emailRow) {
      throw new Error(`E-mail ${emailId} não encontrado`);
    }

    const ownerScope = emailRow.userId ? { userId: emailRow.userId } : {};
    const triageAgentRow = await this.prisma.agent.findFirst({
      where: { type: AgentType.TRIAGE, ...ownerScope },
    });
    const reportAgentRow = await this.prisma.agent.findFirst({
      where: { type: AgentType.REPORT, ...ownerScope },
    });
    const escalationAgentRow = await this.prisma.agent.findFirst({
      where: { type: AgentType.ESCALATION, ...ownerScope },
    });

    const logAgentId =
      triageAgentRow?.id ?? reportAgentRow?.id ?? escalationAgentRow?.id;
    if (!logAgentId) {
      throw new Error('Nenhum agente cadastrado para registrar logs');
    }

    const writeLog = async (params: {
      agentId: string;
      action: string;
      success: boolean;
      input?: Prisma.InputJsonValue;
      output?: Prisma.InputJsonValue;
      error?: string;
      durationMs?: number;
    }) => {
      await this.prisma.agentLog.create({ data: params });
    };

    const started = Date.now();

    try {
      await writeLog({
        agentId: logAgentId,
        action: 'start',
        success: true,
        input: { emailId, jobId: String(job.id) },
      });

      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
      });
      if (!email) {
        throw new Error(`E-mail ${emailId} não encontrado`);
      }

      const triage = await this.triageAgent.process({
        subject: email.subject,
        body: email.body,
        from: email.from,
      });

      const agentDecisionCore = {
        reasoning: triage.reasoning,
        summary: triage.summary,
        suggestedActions: triage.suggestedActions,
        sentiment: triage.sentiment,
        category: triage.category,
        priority: triage.priority,
        confidence: triage.confidence,
        pipelineStep: 'classified',
      };

      await this.prisma.email.update({
        where: { id: emailId },
        data: {
          category: triage.category,
          priority: triage.priority,
          confidence: triage.confidence,
          agentDecision: agentDecisionCore as Prisma.InputJsonValue,
        },
      });

      await writeLog({
        agentId: logAgentId,
        action: 'classified',
        success: true,
        durationMs: Date.now() - started,
        output: {
          category: triage.category,
          priority: triage.priority,
          sentiment: triage.sentiment,
        },
      });

      const reportJob = await this.reportQueue.add(
        GENERATE_REPORT_FROM_EMAIL_JOB,
        {
          emailId,
          type: 'pos-triagem',
          period: '24h',
        },
        {
          removeOnComplete: 100,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      await reportJob.waitUntilFinished(this.reportQueueEvents, 120_000);

      const highPriority = triage.priority === EmailPriority.HIGH;
      let escalated = false;

      if (highPriority) {
        const escalationJob = await this.escalationQueue.add(
          CREATE_ESCALATION_TICKET_JOB,
          {
            emailId,
            subject: `Escalonamento automático: ${email.subject.slice(0, 120)}`,
            description:
              `Triagem automática identificou prioridade alta.\n\n` +
              `${triage.reasoning}\nSentimento: ${triage.sentiment}`,
            priority: 'high',
            userId: email.userId,
          },
          {
            removeOnComplete: 100,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
        escalated = !!escalationJob.id;

        await writeLog({
          agentId: escalationAgentRow?.id ?? logAgentId,
          action: 'escalated',
          success: true,
          output: {
            emailId,
            ticketCreated: escalated,
            highPriority: true,
          },
        });
      }

      const finalStatus = highPriority
        ? EmailStatus.ESCALATED
        : EmailStatus.TRIAGED;

      await this.prisma.email.update({
        where: { id: emailId },
        data: {
          status: finalStatus,
          processedAt: new Date(),
          agentDecision: {
            ...agentDecisionCore,
            pipelineStep: 'done',
            finalStatus,
          } as Prisma.InputJsonValue,
        },
      });

      await writeLog({
        agentId: logAgentId,
        action: 'done',
        success: true,
        durationMs: Date.now() - started,
        output: { status: finalStatus },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Pipeline falhou para ${emailId}: ${message}`);

      await this.prisma.email
        .update({
          where: { id: emailId },
          data: {
            status: EmailStatus.FAILED,
            agentDecision: {
              pipelineError: message,
              pipelineStep: 'error',
              at: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        })
        .catch(() => undefined);

      await writeLog({
        agentId: logAgentId,
        action: 'pipeline.error',
        success: false,
        error: message,
        durationMs: Date.now() - started,
      });

      throw err;
    }
  }
}
