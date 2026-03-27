import { ConfigService } from '@nestjs/config';
import type { Email } from '@prisma/client';
import {
  EmailCategory,
  EmailPriority,
  EmailStatus,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportAgentService } from './report-agent.service';

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(function MockChatOpenAI() {
    return {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: mockInvoke,
      }),
    };
  }),
}));

function fakeEmail(overrides: Partial<Email> = {}): Email {
  const base = {
    id: 'email-1',
    from: 'shipper@test.com',
    to: null,
    subject: 'Cotação frete SP-RJ',
    body: 'Preciso de cotação para 12 pallets.',
    rawHeaders: null,
    category: EmailCategory.ACTION_REQUIRED,
    priority: EmailPriority.MEDIUM,
    confidence: 87,
    status: EmailStatus.TRIAGED,
    processedAt: new Date(),
    agentDecision: {
      category: EmailCategory.ACTION_REQUIRED,
      priority: EmailPriority.MEDIUM,
      sentiment: 'neutral',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { ...base, ...overrides } as Email;
}

describe('ReportAgentService', () => {
  let config: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test';
    config = {
      get: vi.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'sk-test';
        if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
        return undefined;
      }),
    } as unknown as ConfigService;
  });

  it('generateFromEmail com LLM mockado retorna título e corpo estruturado', async () => {
    mockInvoke.mockResolvedValueOnce({
      title: 'Relatório pós-triagem — NFe 123',
      emailSummary: 'Pedido de cotação de frete.',
      sentimentAnalysis: 'Tom operacional neutro.',
      recommendedAction: 'Responder com proposta em 24h.',
      estimatedResponseTime: '1 dia útil',
    });

    const svc = new ReportAgentService(config);
    const email = fakeEmail();
    const res = await svc.generateFromEmail({
      email,
      type: 'pos-triagem',
      period: '24h',
    });

    expect(res.status).toBe('COMPLETED');
    expect(res.title).toContain('NFe');
    expect(res.content.emailSummary).toMatch(/cotação/i);
    expect(res.content.recommendedAction).toMatch(/24h/i);
    expect(res.content.estimatedResponseTime).toBe('1 dia útil');
    expect(res.content.sourceEmailId).toBe(email.id);
    expect(res.content.triage?.priority).toBe('MEDIUM');
  });

  it('sem API key: mock interno usa dados do e-mail (shape Prisma)', async () => {
    delete process.env.OPENAI_API_KEY;
    const cfg = { get: vi.fn(() => undefined) } as unknown as ConfigService;

    const svc = new ReportAgentService(cfg);
    const email = fakeEmail({
      agentDecision: {
        category: EmailCategory.URGENT,
        priority: EmailPriority.HIGH,
        sentiment: 'negative',
      },
    });
    const res = await svc.generateFromEmail({
      email,
      type: 'pos-triagem',
      period: '7d',
    });

    expect(res.content.sourceEmailId).toBe('email-1');
    expect(res.content.triage?.priority).toBe('HIGH');
    expect(res.content.recommendedAction).toMatch(/supervisor|operações|2h/i);
  });

  it('LLM falha: usa mockGenerate como fallback', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('timeout'));

    const svc = new ReportAgentService(config);
    const res = await svc.generateFromEmail({
      email: fakeEmail(),
      type: 'pos-triagem',
      period: '24h',
    });

    expect(res.status).toBe('COMPLETED');
    expect(res.content.emailSummary).toMatch(/Assunto:/);
  });
});
