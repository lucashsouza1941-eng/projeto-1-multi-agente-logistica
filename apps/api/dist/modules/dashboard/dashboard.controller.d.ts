import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboard;
    constructor(dashboard: DashboardService);
    getKpis(period?: string): Promise<{
        emailsProcessedToday: number;
        emailsProcessedWeek: number;
        emailsProcessedMonth: number;
        triageAccuracyPercent: number;
        reportsGenerated: number;
        ticketsEscalated: number;
        avgProcessingTimeMs: number;
        period: string;
    }>;
    getActivity(limit?: string): Promise<{
        id: string;
        agentName: string;
        action: string;
        timestamp: string;
        status: string;
    }[]>;
    getVolumeChart(granularity?: string): Promise<{
        granularity: string;
        data: {
            label: string;
            value: number;
        }[];
    }>;
}
