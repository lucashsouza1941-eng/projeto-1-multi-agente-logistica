import { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import { AgentType, EmailCategory, EmailPriority, EmailStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TriageAgentService } from '../agents/triage-agent.service';
import { PROCESS_EMAIL_JOB } from '../queues/queue-jobs.constants';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTriageProcessor } from './email-triage.processor';

vi.mock('bullmq', () => ({
  QueueEvents: vi.fn().mockImplementation(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

function makeJob(emailId: string): Job<{ emailId: string }> {
  return {
    name: PROCESS_EMAIL_JOB,
    id: 'job-1',
    data: { emailId },
  } as Job<{ emailId: string }>;
}

describe('EmailTriageProcessor (escalação automática)', () => {
  let prisma: PrismaService;
  let triageAgent: TriageAgentService;
  let reportQueue: Queue;
  let config: ConfigService;
  let processor: EmailTriageProcessor;

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      agent: {
        findFirst: vi.fn().mockImplementation((args: { where: { type: AgentType } }) =>
          Promise.resolve({ id: `agent-${args.where.type}`, type: args.where.type }),
        ),
      },
      email: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      agentLog: {
        create: vi.fn().mockResolvedValue({}),
      },
      escalationTicket: {
        findUnique: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 'ticket-new' }),
      },
    } as unknown as PrismaService;

    triageAgent = {
      process: vi.fn(),
    } as unknown as TriageAgentService;

    reportQueue = {
      add: vi.fn().mockResolvedValue({
        waitUntilFinished: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as Queue;

    config = {
      get: vi.fn().mockReturnValue('redis://127.0.0.1:6379'),
    } as unknown as ConfigService;

    processor = new EmailTriageProcessor(
      prisma,
      triageAgent,
      config,
      reportQueue,
    );
  });

  it('cria ticket quando triagem é HIGH e não há ticket existente para o e-mail', async () => {
    vi.mocked(prisma.email.findUnique).mockResolvedValue({
      id: 'e1',
      subject: 'Atraso crítico na rota',
      body: 'Precisamos de ação imediata.',
      from: 'cliente@corp.com',
    } as Awaited<ReturnType<PrismaService['email']['findUnique']>>);

    vi.mocked(triageAgent.process).mockResolvedValue({
      category: EmailCategory.URGENT,
      priority: EmailPriority.HIGH,
      confidence: 91,
      reasoning: 'Impacto em SLA.',
      suggestedActions: ['Escalonar'],
      sentiment: 'negative',
      summary: 'S',
    });

    vi.mocked(prisma.escalationTicket.findUnique).mockResolvedValue(null);

    await processor.process(makeJob('e1'));

    expect(prisma.escalationTicket.create).toHaveBeenCalledTimes(1);
    expect(prisma.escalationTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailId: 'e1',
          source: 'email-triage-pipeline',
          priority: 'high',
        }),
      }),
    );

    const updates = vi.mocked(prisma.email.update).mock.calls;
    const lastUpdate = updates[updates.length - 1]?.[0] as {
      data: { status: EmailStatus };
    };
    expect(lastUpdate?.data?.status).toBe(EmailStatus.ESCALATED);
  });

  it('não cria ticket duplicado se já existe vínculo por emailId', async () => {
    vi.mocked(prisma.email.findUnique).mockResolvedValue({
      id: 'e2',
      subject: 'S',
      body: 'B',
      from: 'a@b.com',
    } as Awaited<ReturnType<PrismaService['email']['findUnique']>>);

    vi.mocked(triageAgent.process).mockResolvedValue({
      category: EmailCategory.URGENT,
      priority: EmailPriority.HIGH,
      confidence: 90,
      reasoning: 'R',
      suggestedActions: [],
      sentiment: 'negative',
    });

    vi.mocked(prisma.escalationTicket.findUnique).mockResolvedValue({
      id: 'existing',
    } as Awaited<ReturnType<PrismaService['escalationTicket']['findUnique']>>);

    await processor.process(makeJob('e2'));

    expect(prisma.escalationTicket.create).not.toHaveBeenCalled();
  });

  it('prioridade não HIGH finaliza como TRIAGED sem novo ticket', async () => {
    vi.mocked(prisma.email.findUnique).mockResolvedValue({
      id: 'e3',
      subject: 'Newsletter',
      body: 'Atualização semanal',
      from: 'news@x.com',
    } as Awaited<ReturnType<PrismaService['email']['findUnique']>>);

    vi.mocked(triageAgent.process).mockResolvedValue({
      category: EmailCategory.ROUTINE,
      priority: EmailPriority.LOW,
      confidence: 80,
      reasoning: 'Rotina',
      suggestedActions: [],
      sentiment: 'neutral',
    });

    await processor.process(makeJob('e3'));

    expect(prisma.escalationTicket.findUnique).not.toHaveBeenCalled();
    expect(prisma.escalationTicket.create).not.toHaveBeenCalled();

    const updates = vi.mocked(prisma.email.update).mock.calls;
    const lastUpdate = updates[updates.length - 1]?.[0] as {
      data: { status: EmailStatus };
    };
    expect(lastUpdate?.data?.status).toBe(EmailStatus.TRIAGED);
  });

  it('ignora jobs com nome diferente de process-email', async () => {
    const job = { name: 'other', id: 'j', data: { emailId: 'e' } } as Job<{ emailId: string }>;
    await processor.process(job);
    expect(prisma.email.findUnique).not.toHaveBeenCalled();
  });
});
