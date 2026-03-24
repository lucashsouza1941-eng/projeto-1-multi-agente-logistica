import { PrismaService } from '../../prisma/prisma.service';
export declare class EmailService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private actionLabel;
    private toDto;
    list(page: number, limit: number, category?: string, _sort?: string): Promise<{
        data: {
            id: string;
            from: string;
            fromEmail: string;
            subject: string;
            category: import("@prisma/client").$Enums.EmailCategory;
            priority: import("@prisma/client").$Enums.EmailPriority;
            confidence: number;
            actionTaken: string;
            date: string;
            preview: string;
            aiReasoning: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getById(id: string): Promise<{
        id: string;
        from: string;
        fromEmail: string;
        subject: string;
        category: import("@prisma/client").$Enums.EmailCategory;
        priority: import("@prisma/client").$Enums.EmailPriority;
        confidence: number;
        actionTaken: string;
        date: string;
        preview: string;
        aiReasoning: string;
    }>;
    reclassify(id: string, body: {
        category: string;
        priority: string;
    }): Promise<{
        id: string;
        category: import("@prisma/client").$Enums.EmailCategory;
        priority: import("@prisma/client").$Enums.EmailPriority;
        updated: boolean;
    }>;
    bulkAction(ids: string[], action: string): Promise<{
        processed: number;
        action: string;
    }>;
}
