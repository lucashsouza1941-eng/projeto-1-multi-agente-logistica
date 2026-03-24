import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private startOfDayUtc;
    private startOfWeekUtc;
    private startOfMonthUtc;
    getKpis(period: string): Promise<{
        emailsProcessedToday: number;
        emailsProcessedWeek: number;
        emailsProcessedMonth: number;
        triageAccuracyPercent: number;
        reportsGenerated: number;
        ticketsEscalated: number;
        avgProcessingTimeMs: number;
        period: string;
    }>;
    getActivity(limit: number): Promise<{
        id: string;
        agentName: string;
        action: string;
        timestamp: string;
        status: string;
    }[]>;
    getVolumeChart(granularity: string): Promise<{
        granularity: string;
        data: {
            label: string;
            value: number;
        }[];
    }>;
}
