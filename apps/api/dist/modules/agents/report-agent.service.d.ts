import { ConfigService } from '@nestjs/config';
export declare class ReportAgentService {
    private readonly config;
    private status;
    private lastRunAt?;
    constructor(config: ConfigService);
    generate(params: {
        type: string;
        period: string;
    }): Promise<{
        title: string;
        content: unknown;
        status: string;
    }>;
    getStatus(): {
        name: string;
        type: "REPORT";
        status: "ONLINE" | "OFFLINE" | "PROCESSING";
        lastRunAt: Date | undefined;
    };
}
