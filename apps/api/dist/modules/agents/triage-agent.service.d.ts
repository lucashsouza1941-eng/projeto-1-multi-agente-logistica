import { ConfigService } from '@nestjs/config';
export interface TriageResult {
    category: string;
    priority: string;
    confidence: number;
    reasoning: string;
    suggestedActions: string[];
}
export declare class TriageAgentService {
    private readonly config;
    private status;
    private lastRunAt?;
    private confidenceThreshold;
    constructor(config: ConfigService);
    process(email: {
        subject: string;
        body: string;
        from: string;
    }): Promise<TriageResult>;
    getStatus(): {
        name: string;
        type: "TRIAGE";
        status: "ONLINE" | "OFFLINE" | "PROCESSING";
        lastRunAt: Date | undefined;
    };
    configure(config: {
        confidenceThreshold?: number;
    }): void;
}
