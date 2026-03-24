import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    list(page?: string, limit?: string, category?: string, sort?: string): Promise<{
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
    bulkAction(body: {
        ids: string[];
        action: string;
    }): Promise<{
        processed: number;
        action: string;
    }>;
}
