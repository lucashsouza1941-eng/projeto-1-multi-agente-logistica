import { Injectable, NotFoundException } from '@nestjs/common';
import { EscalationTicketStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const RULES_SETTING_KEY = 'escalation_rules';

type TicketRow = {
  id: string;
  subject: string;
  priority: string;
  status: EscalationTicketStatus;
  assignee: string | null;
  createdAt: Date;
  timeline: Prisma.JsonValue;
};

@Injectable()
export class EscalationService {
  constructor(private readonly prisma: PrismaService) {}

  private mapTicket(t: TicketRow) {
    const timeline = Array.isArray(t.timeline) ? t.timeline : [];
    return {
      id: t.id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      assignee: t.assignee,
      createdAt: t.createdAt.toISOString(),
      timeline,
    };
  }

  async listTickets(status?: string) {
    const where: { status?: EscalationTicketStatus } = {};
    if (status && Object.values(EscalationTicketStatus).includes(status as EscalationTicketStatus)) {
      where.status = status as EscalationTicketStatus;
    }
    const rows = await this.prisma.escalationTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((t) => this.mapTicket(t));
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.escalationTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.mapTicket(ticket);
  }

  async updateStatus(id: string, status: EscalationTicketStatus) {
    if (!Object.values(EscalationTicketStatus).includes(status)) {
      throw new NotFoundException('Invalid status');
    }
    try {
      const updated = await this.prisma.escalationTicket.update({
        where: { id },
        data: { status },
      });
      return { id: updated.id, status: updated.status, updated: true };
    } catch {
      throw new NotFoundException('Ticket not found');
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

  async updateRules(rules: unknown[]) {
    const value = rules as Prisma.InputJsonValue;
    await this.prisma.setting.upsert({
      where: { key: RULES_SETTING_KEY },
      create: {
        key: RULES_SETTING_KEY,
        value,
        category: 'escalation',
      },
      update: { value },
    });
    return { rules, updated: true };
  }
}
