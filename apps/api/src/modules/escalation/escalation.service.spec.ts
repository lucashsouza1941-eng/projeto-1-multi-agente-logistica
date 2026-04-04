import { NotFoundException } from '@nestjs/common';
import { EscalationTicketStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RulesEngineService } from './rules-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EscalationService } from './escalation.service';

describe('EscalationService', () => {
  const uid = 'user_1';
  let prisma: PrismaService;
  let svc: EscalationService;

  beforeEach(() => {
    prisma = {
      escalationTicket: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      setting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    } as unknown as PrismaService;
    svc = new EscalationService(prisma);
  });

  it('getRules retorna regras padrão quando não há setting', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null);

    const rules = await svc.getRules();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(2);
    expect(rules.some((r: { conditions?: string[] }) =>
      r.conditions?.includes('urgente'),
    )).toBe(true);
  });

  it('getRules retorna regras salvas no Setting', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      id: '1',
      key: 'escalation_rules',
      value: [{ id: 'x', name: 'Custom', priority: 'HIGH', enabled: true }],
      category: 'escalation',
      updatedAt: new Date(),
    });

    const rules = await svc.getRules();
    expect(rules).toEqual([
      { id: 'x', name: 'Custom', priority: 'HIGH', enabled: true },
    ]);
  });

  it('updateRules persiste via upsert', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({
      id: '1',
      key: 'escalation_rules',
      value: [],
      category: 'escalation',
      updatedAt: new Date(),
    });

    const next = [{ id: '1', name: 'Regra A', enabled: true }];
    const out = await svc.updateRules(next);

    expect(out.updated).toBe(true);
    expect(prisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'escalation_rules' },
      }),
    );
  });

  it('listTickets filtra por status válido', async () => {
    vi.mocked(prisma.escalationTicket.findMany).mockResolvedValue([
      {
        id: 't1',
        subject: 'S',
        priority: 'high',
        status: EscalationTicketStatus.NEW,
        assignee: null,
        createdAt: new Date(),
        timeline: [],
        description: '',
        source: null,
        emailId: null,
        aiDecisionLog: [],
        updatedAt: new Date(),
        userId: uid,
      },
    ]);

    const rows = await svc.listTickets(uid, 'NEW');
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe(EscalationTicketStatus.NEW);
    expect(prisma.escalationTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: uid, status: EscalationTicketStatus.NEW },
      }),
    );
  });

  it('getTicket lança NotFound quando inexistente', async () => {
    vi.mocked(prisma.escalationTicket.findUnique).mockResolvedValue(null);

    await expect(svc.getTicket(uid, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('regras padrão (getRules) alinham com motor HIGH/URGENT para escalação', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null);
    const rules = await svc.getRules();
    const engine = new RulesEngineService();

    const urgentRule = rules.find(
      (r: { conditions?: string[] }) => r.conditions?.includes('urgente'),
    );
    expect(urgentRule).toBeTruthy();

    expect(engine.evaluate({ priority: 'HIGH', category: 'ROUTINE' }).match).toBe(true);
    expect(engine.evaluate({ priority: 'LOW', category: 'URGENT' }).match).toBe(true);
  });

  it('createTicket persiste ticket NEW com userId', async () => {
    vi.mocked(prisma.escalationTicket.create).mockImplementation(async (args) => {
      const d = args.data as {
        subject: string;
        description: string;
        priority: string;
        userId: string;
      };
      return {
        id: 'new1',
        subject: d.subject,
        priority: d.priority,
        status: EscalationTicketStatus.NEW,
        assignee: null,
        createdAt: new Date(),
        timeline: [],
        description: d.description,
        source: 'manual',
        emailId: null,
        aiDecisionLog: [],
        updatedAt: new Date(),
        userId: d.userId,
      };
    });

    const out = await svc.createTicket(uid, {
      subject: '  Assunto  ',
      description: '  Corpo  ',
      priority: 'high',
    });

    expect(out.subject).toBe('Assunto');
    expect(prisma.escalationTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: uid,
          subject: 'Assunto',
          description: 'Corpo',
          priority: 'high',
          status: EscalationTicketStatus.NEW,
        }),
      }),
    );
  });

  it('updateStatus atualiza ticket existente', async () => {
    vi.mocked(prisma.escalationTicket.findUnique).mockResolvedValue({
      id: 't1',
      userId: uid,
      subject: 'S',
      description: '',
      priority: 'high',
      status: EscalationTicketStatus.NEW,
      assignee: null,
      source: null,
      emailId: null,
      aiDecisionLog: [],
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.escalationTicket.update).mockResolvedValue({
      id: 't1',
      subject: 'S',
      description: '',
      priority: 'high',
      status: EscalationTicketStatus.RESOLVED,
      assignee: null,
      source: null,
      emailId: null,
      aiDecisionLog: [],
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: uid,
    });

    const out = await svc.updateStatus(uid, 't1', EscalationTicketStatus.RESOLVED);
    expect(out.updated).toBe(true);
    expect(out.status).toBe(EscalationTicketStatus.RESOLVED);
  });
});
