import { PrismaService } from '../../prisma/prisma.service';
export declare class AgentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private startOfDayUtc;
    list(): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.AgentType;
        status: import("@prisma/client").$Enums.AgentStatus;
        lastRunAt: string;
        totalProcessed: number;
        successRate: number;
        metrics: Record<string, number>;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.AgentType;
        status: import("@prisma/client").$Enums.AgentStatus;
        lastRunAt: string | undefined;
        totalProcessed: number;
        successRate: number;
        metrics: {
            processedToday: number;
        };
    }>;
    getLogs(agentId: string, limit: number): Promise<{
        id: string;
        agentId: string;
        action: string;
        durationMs: number | null;
        success: boolean;
        createdAt: string;
    }[]>;
    updateConfig(id: string, config: Record<string, unknown>): Promise<{
        id: string;
        config: import("@prisma/client/runtime/library").JsonValue;
        updated: boolean;
    }>;
    restart(id: string): Promise<{
        id: string;
        status: string;
        message: string;
    }>;
}
