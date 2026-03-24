"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    startOfDayUtc() {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    startOfWeekUtc() {
        const d = new Date();
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        d.setUTCDate(diff);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    startOfMonthUtc() {
        const d = new Date();
        d.setUTCDate(1);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    async getKpis(period) {
        const today = this.startOfDayUtc();
        const weekStart = this.startOfWeekUtc();
        const monthStart = this.startOfMonthUtc();
        const [emailsProcessedToday, emailsProcessedWeek, emailsProcessedMonth, reportsGenerated, ticketsEscalated, triageAgg, avgLog,] = await Promise.all([
            this.prisma.email.count({ where: { createdAt: { gte: today } } }),
            this.prisma.email.count({ where: { createdAt: { gte: weekStart } } }),
            this.prisma.email.count({ where: { createdAt: { gte: monthStart } } }),
            this.prisma.report.count({ where: { status: 'COMPLETED' } }),
            this.prisma.escalationTicket.count({
                where: { status: { in: ['NEW', 'ANALYZING', 'ESCALATED'] } },
            }),
            this.prisma.email.aggregate({
                where: { status: 'TRIAGED' },
                _avg: { confidence: true },
            }),
            this.prisma.agentLog.aggregate({
                where: { success: true, durationMs: { not: null } },
                _avg: { durationMs: true },
            }),
        ]);
        const triageAccuracyPercent = triageAgg._avg.confidence != null
            ? Math.round(triageAgg._avg.confidence * 10) / 10
            : 0;
        const avgProcessingTimeMs = avgLog._avg.durationMs != null
            ? Math.round(avgLog._avg.durationMs)
            : 1200;
        return {
            emailsProcessedToday,
            emailsProcessedWeek,
            emailsProcessedMonth,
            triageAccuracyPercent,
            reportsGenerated,
            ticketsEscalated,
            avgProcessingTimeMs,
            period,
        };
    }
    async getActivity(limit) {
        const logs = await this.prisma.agentLog.findMany({
            take: Math.min(limit, 100),
            orderBy: { createdAt: 'desc' },
            include: { agent: { select: { name: true } } },
        });
        return logs.map((l) => ({
            id: l.id,
            agentName: l.agent?.name ?? 'Agente',
            action: l.action,
            timestamp: l.createdAt.toISOString(),
            status: l.success ? 'success' : 'error',
        }));
    }
    async getVolumeChart(granularity) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const emails = await this.prisma.email.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true },
        });
        const buckets = Array.from({ length: 24 }, (_, i) => ({
            label: `${i}h`,
            value: 0,
        }));
        for (const e of emails) {
            const h = e.createdAt.getUTCHours();
            if (h >= 0 && h < 24)
                buckets[h].value += 1;
        }
        return { granularity, data: buckets };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map