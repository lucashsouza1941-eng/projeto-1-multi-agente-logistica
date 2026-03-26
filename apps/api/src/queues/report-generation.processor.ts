import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AgentType, Prisma, ReportStatus } from '@prisma/client';
import { ReportAgentService } from '../langchain/report-agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { GENERATE_REPORT_FROM_EMAIL_JOB } from './queue-jobs.constants';

export type GenerateReportFromEmailPayload = {
  emailId: string;
  type?: string;
  period?: string;
};

@Processor('report-generation')
export class ReportGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportAgent: ReportAgentService,
  ) {
    super();
  }

  async process(
    job: Job<GenerateReportFromEmailPayload>,
  ): Promise<{ reportId: string }> {
    if (job.name !== GENERATE_REPORT_FROM_EMAIL_JOB) {
      this.logger.warn(`Ignorando job com nome "${job.name}"`);
      return { reportId: '' };
    }

    const emailId = job.data?.emailId;
    if (!emailId) {
      throw new Error('emailId obrigatório');
    }

    const reportAgentRow = await this.prisma.agent.findFirst({
      where: { type: AgentType.REPORT },
    });
    if (!reportAgentRow) {
      throw new Error('Agente REPORT não cadastrado');
    }

    const started = Date.now();

    try {
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
      });
      if (!email) {
        throw new Error(`E-mail ${emailId} não encontrado`);
      }

      const type = job.data.type ?? 'pos-triagem';
      const period = job.data.period ?? '24h';
      const result = await this.reportAgent.generate({ type, period });

      const report = await this.prisma.report.create({
        data: {
          title: result.title,
          type,
          content: result.content as Prisma.InputJsonValue,
          status: ReportStatus.COMPLETED,
          period,
          agentId: reportAgentRow.id,
          parameters: {
            sourceEmailId: emailId,
            jobId: String(job.id),
          } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.agentLog.create({
        data: {
          agentId: reportAgentRow.id,
          action: 'reported',
          success: true,
          durationMs: Date.now() - started,
          input: { emailId, type, period },
          output: { reportId: report.id, title: report.title },
        },
      });

      return { reportId: report.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Geração de relatório falhou: ${message}`);
      await this.prisma.agentLog
        .create({
          data: {
            agentId: reportAgentRow.id,
            action: 'reported',
            success: false,
            error: message,
            durationMs: Date.now() - started,
            input: { emailId, payload: job.data },
          },
        })
        .catch(() => undefined);
      throw err;
    }
  }
}
