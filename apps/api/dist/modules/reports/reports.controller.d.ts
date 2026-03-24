import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    list(status?: string): Promise<{
        id: string;
        title: string;
        type: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        createdAt: string;
        generatedBy: string;
        period: string;
        summary: string | undefined;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        title: string;
        type: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        createdAt: string;
        generatedBy: string;
        period: string;
        summary: string;
        content: {
            sections: {
                title: string;
                body: string;
            }[];
            raw: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    create(body: {
        title: string;
        type: string;
        period: string;
        parameters?: Record<string, unknown>;
    }): Promise<{
        id: string;
        title: string;
        type: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        createdAt: string;
    }>;
    regenerate(id: string): Promise<{
        id: string;
        status: string;
        message: string;
    }>;
}
