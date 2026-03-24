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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(status) {
        const where = status && Object.values(client_1.ReportStatus).includes(status)
            ? { status: status }
            : {};
        const rows = await this.prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { agent: { select: { name: true } } },
        });
        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            generatedBy: r.agent?.name ?? 'Gerador de Relatórios',
            period: r.parameters && typeof r.parameters === 'object' && r.parameters !== null && 'period' in r.parameters
                ? String(r.parameters.period)
                : '—',
            summary: r.content && typeof r.content === 'object' && r.content !== null && 'summary' in r.content
                ? String(r.content.summary)
                : undefined,
        }));
    }
    async getById(id) {
        const report = await this.prisma.report.findUnique({
            where: { id },
            include: { agent: { select: { name: true } } },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        const summary = report.content && typeof report.content === 'object' && report.content !== null && 'summary' in report.content
            ? String(report.content.summary)
            : 'N/A';
        return {
            id: report.id,
            title: report.title,
            type: report.type,
            status: report.status,
            createdAt: report.createdAt.toISOString(),
            generatedBy: report.agent?.name ?? 'Gerador de Relatórios',
            period: report.parameters &&
                typeof report.parameters === 'object' &&
                report.parameters !== null &&
                'period' in report.parameters
                ? String(report.parameters.period)
                : '—',
            summary,
            content: {
                sections: [{ title: 'Resumo', body: summary }],
                raw: report.content,
            },
        };
    }
    async create(body) {
        const report = await this.prisma.report.create({
            data: {
                title: body.title,
                type: body.type,
                status: 'PENDING',
                parameters: body.parameters
                    ? { ...body.parameters, period: body.period }
                    : { period: body.period },
            },
        });
        return {
            id: report.id,
            title: report.title,
            type: report.type,
            status: report.status,
            createdAt: report.createdAt.toISOString(),
        };
    }
    async regenerate(id) {
        const exists = await this.prisma.report.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Report not found');
        await this.prisma.report.update({
            where: { id },
            data: { status: 'GENERATING' },
        });
        return { id, status: 'PENDING', message: 'Regeneration queued' };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map