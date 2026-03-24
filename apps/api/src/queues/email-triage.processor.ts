import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('email-triage')
export class EmailTriageProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailTriageProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.debug(`email-triage job ${job.id} received`);
  }
}
