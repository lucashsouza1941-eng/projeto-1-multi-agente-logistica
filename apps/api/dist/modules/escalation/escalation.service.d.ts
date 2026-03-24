import { PrismaService } from '../../prisma/prisma.service';
export declare class EscalationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapTicket;
    listTickets(status?: string): Promise<{
        id: string;
        subject: string;
        priority: import("@prisma/client").$Enums.EmailPriority;
        status: import("@prisma/client").$Enums.EscalationTicketStatus;
        assignee: string | null;
        createdAt: string;
        resolvedAt: string | undefined;
        timeline: any[];
    }[]>;
    getTicket(id: string): Promise<{
        id: string;
        subject: string;
        priority: import("@prisma/client").$Enums.EmailPriority;
        status: import("@prisma/client").$Enums.EscalationTicketStatus;
        assignee: string | null;
        createdAt: string;
        resolvedAt: string | undefined;
        timeline: any[];
    }>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.EscalationTicketStatus;
        updated: boolean;
    }>;
    getRules(): Promise<import("@prisma/client/runtime/library").JsonArray | {
        id: string;
        name: string;
        priority: string;
        conditions: string[];
        enabled: boolean;
    }[]>;
    updateRules(rules: unknown[]): Promise<{
        rules: unknown[];
        updated: boolean;
    }>;
}
