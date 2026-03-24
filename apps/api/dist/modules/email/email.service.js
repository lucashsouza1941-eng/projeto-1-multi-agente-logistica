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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let EmailService = class EmailService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    actionLabel(status) {
        const map = {
            PENDING: 'Pendente',
            TRIAGED: 'Triado',
            ESCALATED: 'Escalonado',
            RESOLVED: 'Resolvido',
        };
        return map[status] ?? status;
    }
    toDto(e) {
        const reasoning = e.agentDecision &&
            typeof e.agentDecision === 'object' &&
            e.agentDecision !== null &&
            'reasoning' in e.agentDecision
            ? String(e.agentDecision.reasoning)
            : 'Classificado pelo agente de triagem.';
        return {
            id: e.id,
            from: e.from,
            fromEmail: e.from,
            subject: e.subject,
            category: e.category,
            priority: e.priority,
            confidence: e.confidence,
            actionTaken: this.actionLabel(e.status),
            date: e.createdAt.toISOString(),
            preview: e.body.length > 200 ? `${e.body.slice(0, 200)}...` : e.body,
            aiReasoning: reasoning,
        };
    }
    async list(page, limit, category, _sort) {
        const where = category && category !== 'all' && Object.values(client_1.EmailCategory).includes(category)
            ? { category: category }
            : {};
        const [total, rows] = await Promise.all([
            this.prisma.email.count({ where }),
            this.prisma.email.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return {
            data: rows.map((e) => this.toDto(e)),
            total,
            page,
            limit,
        };
    }
    async getById(id) {
        const email = await this.prisma.email.findUnique({ where: { id } });
        if (!email)
            throw new common_1.NotFoundException('Email not found');
        return this.toDto(email);
    }
    async reclassify(id, body) {
        if (!Object.values(client_1.EmailCategory).includes(body.category)) {
            throw new common_1.NotFoundException('Invalid category');
        }
        if (!Object.values(client_1.EmailPriority).includes(body.priority)) {
            throw new common_1.NotFoundException('Invalid priority');
        }
        const updated = await this.prisma.email.update({
            where: { id },
            data: {
                category: body.category,
                priority: body.priority,
                status: 'TRIAGED',
            },
        });
        return { id: updated.id, category: updated.category, priority: updated.priority, updated: true };
    }
    async bulkAction(ids, action) {
        if (action === 'approve' || action === 'reclassify') {
            await this.prisma.email.updateMany({
                where: { id: { in: ids } },
                data: { status: 'TRIAGED' },
            });
        }
        if (action === 'reject') {
            await this.prisma.email.updateMany({
                where: { id: { in: ids } },
                data: { status: 'RESOLVED' },
            });
        }
        return { processed: ids.length, action };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map