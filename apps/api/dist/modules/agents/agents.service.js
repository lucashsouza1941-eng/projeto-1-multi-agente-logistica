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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AgentsService = class AgentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    startOfDayUtc() {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    async list() {
        const dayStart = this.startOfDayUtc();
        const agents = await this.prisma.agent.findMany({ orderBy: { name: 'asc' } });
        const avgConf = await this.prisma.email.aggregate({
            _avg: { confidence: true },
        });
        const avgConfidence = avgConf._avg.confidence != null ? Math.round(avgConf._avg.confidence) : 91;
        const openTickets = await this.prisma.escalationTicket.count({
            where: { status: { in: ['NEW', 'ANALYZING', 'ESCALATED'] } },
        });
        const weekStart = new Date();
        weekStart.setUTCDate(weekStart.getUTCDate() - 7);
        const reportsThisWeek = await this.prisma.report.count({
            where: { createdAt: { gte: weekStart } },
        });
        return Promise.all(agents.map(async (a) => {
            const processedToday = await this.prisma.agentLog.count({
                where: { agentId: a.id, createdAt: { gte: dayStart } },
            });
            const metrics = {
                processedToday,
                avgConfidence,
            };
            if (a.type === client_1.AgentType.REPORT) {
                metrics.reportsThisWeek = reportsThisWeek;
            }
            if (a.type === client_1.AgentType.ESCALATION) {
                metrics.openTickets = openTickets;
            }
            return {
                id: a.id,
                name: a.name,
                type: a.type,
                status: a.status,
                lastRunAt: a.lastRunAt?.toISOString() ?? new Date().toISOString(),
                totalProcessed: a.totalProcessed,
                successRate: a.successRate,
                metrics,
            };
        }));
    }
    async getById(id) {
        const agent = await this.prisma.agent.findUnique({ where: { id } });
        if (!agent)
            throw new common_1.NotFoundException('Agent not found');
        const dayStart = this.startOfDayUtc();
        const processedToday = await this.prisma.agentLog.count({
            where: { agentId: id, createdAt: { gte: dayStart } },
        });
        return {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            lastRunAt: agent.lastRunAt?.toISOString(),
            totalProcessed: agent.totalProcessed,
            successRate: agent.successRate,
            metrics: { processedToday },
        };
    }
    async getLogs(agentId, limit) {
        const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent)
            throw new common_1.NotFoundException('Agent not found');
        const logs = await this.prisma.agentLog.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 500),
        });
        return logs.map((l) => ({
            id: l.id,
            agentId: l.agentId,
            action: l.action,
            durationMs: l.durationMs,
            success: l.success,
            createdAt: l.createdAt.toISOString(),
        }));
    }
    async updateConfig(id, config) {
        try {
            const agent = await this.prisma.agent.update({
                where: { id },
                data: { config: config },
            });
            return { id: agent.id, config: agent.config, updated: true };
        }
        catch {
            throw new common_1.NotFoundException('Agent not found');
        }
    }
    async restart(id) {
        const agent = await this.prisma.agent.findUnique({ where: { id } });
        if (!agent)
            throw new common_1.NotFoundException('Agent not found');
        return { id, status: 'restarting', message: 'Agent restart initiated' };
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentsService);
//# sourceMappingURL=agents.service.js.map