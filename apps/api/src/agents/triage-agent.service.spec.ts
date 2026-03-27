import { ConfigService } from '@nestjs/config';
import { EmailCategory, EmailPriority } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TriageAgentService } from './triage-agent.service';

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(function MockChatOpenAI(this: unknown) {
    return {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: mockInvoke,
      }),
    };
  }),
}));

describe('TriageAgentService', () => {
  let config: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test-mock';
    config = {
      get: vi.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'sk-test-mock';
        if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
        return undefined;
      }),
    } as unknown as ConfigService;
  });

  it('classifica via LLM (mock): URGENT + HIGH', async () => {
    mockInvoke.mockResolvedValueOnce({
      category: EmailCategory.URGENT,
      priority: EmailPriority.HIGH,
      sentiment: 'negative' as const,
      summary: 'Cliente reclama de atraso crítico.',
      suggestedAction: 'Escalonar operações imediatamente.',
      confidence: 92,
    });

    const svc = new TriageAgentService(config);
    const out = await svc.process({
      subject: 'Atraso',
      body: 'Preciso de resposta',
      from: 'c@acme.com',
    });

    expect(out.category).toBe(EmailCategory.URGENT);
    expect(out.priority).toBe(EmailPriority.HIGH);
    expect(out.sentiment).toBe('negative');
    expect(out.suggestedActions).toEqual(['Escalonar operações imediatamente.']);
    expect(out.confidence).toBe(92);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('classifica via LLM (mock): ROUTINE + LOW', async () => {
    mockInvoke.mockResolvedValueOnce({
      category: EmailCategory.ROUTINE,
      priority: EmailPriority.LOW,
      sentiment: 'neutral' as const,
      summary: 'Comunicação de rotina.',
      suggestedAction: 'Arquivar após leitura.',
      confidence: 88,
    });

    const svc = new TriageAgentService(config);
    const out = await svc.process({
      subject: 'Newsletter',
      body: 'Atualização semanal',
      from: 'news@log.com',
    });

    expect(out.category).toBe(EmailCategory.ROUTINE);
    expect(out.priority).toBe(EmailPriority.LOW);
  });

  it('sem API key: modo mock prioriza urgente no texto', async () => {
    delete process.env.OPENAI_API_KEY;
    const cfgNoKey = {
      get: vi.fn(() => undefined),
    } as unknown as ConfigService;

    const svc = new TriageAgentService(cfgNoKey);
    const out = await svc.process({
      subject: 'Follow-up',
      body: 'Sinistro na rota sul urgente',
      from: 'ops@vendor.com',
    });

    expect(out.category).toBe(EmailCategory.URGENT);
    expect(out.priority).toBe(EmailPriority.HIGH);
  });

  it('LLM falha: heurística detecta palavra urgente', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('rate limit'));

    const svc = new TriageAgentService(config);
    const out = await svc.process({
      subject: 'Ordem',
      body: 'Situação urgente na doca 4',
      from: 'x@y.com',
    });

    expect(out.category).toBe(EmailCategory.URGENT);
    expect(out.priority).toBe(EmailPriority.HIGH);
    expect(out.reasoning).toMatch(/heurística|contingência/i);
  });
});
