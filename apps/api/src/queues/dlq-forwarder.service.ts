import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, QueueEvents } from 'bullmq';
import { AlertService } from '../modules/alerts/alert.service';

@Injectable()
export class DlqForwarderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DlqForwarderService.name);
  private events: QueueEvents[] = [];

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(AlertService) private readonly alerts: AlertService,
    @InjectQueue('failed-jobs') private readonly dlq: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const connection = { url };
    for (const name of [
      'email-triage',
      'report-generation',
      'escalation-processing',
    ] as const) {
      const ev = new QueueEvents(name, { connection });
      await ev.waitUntilReady();
      ev.on('failed', async ({ jobId }) => {
        const source = new Queue(name, { connection });
        try {
          const job = await Job.fromId(source, jobId);
          if (!job) return;
          const maxAttempts = job.opts.attempts ?? 3;
          const stack = (job.stacktrace ?? []).join('\n');
          const unrecoverable =
            stack.includes('UnrecoverableError') ||
            (job.failedReason?.includes('UnrecoverableError') ?? false);
          if (job.attemptsMade < maxAttempts && !unrecoverable) return;
          await this.dlq.add(
            `dlq-from-${name}`,
            {
              sourceQueue: name,
              originalJobId: jobId,
              jobName: job.name,
              data: job.data,
            },
            { removeOnComplete: 200 },
          );
          await this.alerts.send(
            'critical',
            `Job falhou após todas as tentativas e foi enviado à DLQ: ${name} id=${jobId}`,
            {
              sourceQueue: name,
              jobId,
              jobName: job.name,
              attemptsMade: job.attemptsMade,
            },
          );
        } catch (e) {
          this.logger.warn(
            `DLQ forward failed for ${name}/${jobId}: ${e instanceof Error ? e.message : String(e)}`,
          );
        } finally {
          await source.close();
        }
      });
      this.events.push(ev);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.events.map((e) => e.close()));
  }
}
