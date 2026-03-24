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
exports.EscalationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const RULES_SETTING_KEY = 'escalation_rules';
let EscalationService = class EscalationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapTicket(t) {
        return {
            id: t.id,
            subject: t.subject,
            priority: t.priority,
            status: t.status,
            assignee: t.assignedTo,
            createdAt: t.createdAt.toISOString(),
            resolvedAt: t.resolvedAt?.toISOString(),
            timeline: Array.isArray(t.timeline) ? t.timeline : [],
        };
    }
    async listTickets(status) {
        const where = status && Object.values(client_1.EscalationTicketStatus).includes(status)
            ? { status: status }
            : {};
        const rows = await this.prisma.escalationTicket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((t) => this.mapTicket(t));
    }
    async getTicket(id) {
        const ticket = await this.prisma.escalationTicket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.mapTicket(ticket);
    }
    async updateStatus(id, status) {
        if (!Object.values(client_1.EscalationTicketStatus).includes(status)) {
            throw new common_1.NotFoundException('Invalid status');
        }
        try {
            const updated = await this.prisma.escalationTicket.update({
                where: { id },
                data: {
                    status: status,
                    resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
                },
            });
            return { id: updated.id, status: updated.status, updated: true };
        }
        catch {
            throw new common_1.NotFoundException('Ticket not found');
        }
    }
    async getRules() {
        const row = await this.prisma.setting.findUnique({ where: { key: RULES_SETTING_KEY } });
        if (row?.value && Array.isArray(row.value)) {
            return row.value;
        }
        return [
            { id: '1', name: 'Cliente VIP + atraso', priority: 'HIGH', conditions: ['vip', 'atraso'], enabled: true },
            { id: '2', name: 'Palavra-chave URGENTE', priority: 'HIGH', conditions: ['urgente'], enabled: true },
        ];
    }
    async updateRules(rules) {
        await this.prisma.setting.upsert({
            where: { key: RULES_SETTING_KEY },
            create: {
                key: RULES_SETTING_KEY,
                value: rules,
                category: 'escalation',
            },
            update: { value: rules },
        });
        return { rules, updated: true };
    }
};
exports.EscalationService = EscalationService;
exports.EscalationService = EscalationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EscalationService);
//# sourceMappingURL=escalation.service.js.map