import { EscalationService } from './escalation.service';
export declare class EscalationController {
    private readonly escalationService;
    constructor(escalationService: EscalationService);
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
    updateStatus(id: string, body: {
        status: string;
    }): Promise<{
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
    updateRules(body: {
        rules: unknown[];
    }): Promise<{
        rules: unknown[];
        updated: boolean;
    }>;
}
