import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class EmailTriageProcessor extends WorkerHost {
    private readonly logger;
    process(job: Job<Record<string, unknown>>): Promise<void>;
}
