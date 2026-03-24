import { ConfigService } from '@nestjs/config';
export declare class EscalationAgentService {
    private readonly config;
    private status;
    private lastRunAt?;
    constructor(config: ConfigService);
    evaluate(input: {
        priority: string;
        category: string;
        subject: string;
    }): Promise<{
        escalate: boolean;
        reason?: string;
        ruleId?: string;
    }>;
    getStatus(): {
        name: string;
        type: "ESCALATION";
        status: "ONLINE" | "OFFLINE" | "PROCESSING";
        lastRunAt: Date | undefined;
    };
}
