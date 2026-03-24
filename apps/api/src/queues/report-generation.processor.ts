import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('report-generation')
export class ReportGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.debug(`report-generation job ${job.id} received`);
  }
}
