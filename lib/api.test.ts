import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDashboardKpis,
  getEmails,
  createApiKey,
  revokeApiKey,
  createEscalationTicket,
} from './api';

function mockFetchJson(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : ''),
  } as Response;
}

describe('getDashboardKpis', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchJson({
          emailsProcessed: 0,
          emailsProcessedToday: 0,
          emailsProcessedWeek: 0,
          emailsProcessedMonth: 0,
          triageAccuracyPercent: 0,
          reportsGenerated: 0,
          ticketsEscalated: 0,
          agentsOnline: 0,
          emailsPending: 0,
          avgProcessingTimeMs: 0,
          period: '7d',
          startDate: null,
          endDate: null,
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls Next proxy with period query (browser)', async () => {
    await getDashboardKpis('7d');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/backend\/dashboard\/kpis\?period=7d/),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('inclui startDate e endDate quando período custom e intervalo definido', async () => {
    await getDashboardKpis('custom', {
      startDate: '2024-06-01',
      endDate: '2024-06-30',
    });
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain('period=custom');
    expect(url).toContain('startDate=2024-06-01');
    expect(url).toContain('endDate=2024-06-30');
  });
});

describe('getEmails', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockFetchJson({ data: [], total: 0, page: 1, limit: 20 }),
        ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta query string com filtros', async () => {
    await getEmails({ page: 2, limit: 10, category: 'URGENT', sort: 'createdAt:desc' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/api\/backend\/emails\?page=2&limit=10&category=URGENT&sort=createdAt%3Adesc/,
      ),
      expect.any(Object),
    );
  });
});

describe('createApiKey / revokeApiKey', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchJson({ id: 'k1', apiKey: 'logi_x', name: 'Test' }, 201),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST /auth/api-keys só com nome no body (sem userId)', async () => {
    await createApiKey('Integração');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/backend\/auth\/api-keys$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Integração' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    const raw = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined;
    expect(JSON.stringify(raw?.body)).not.toMatch(/userId|ownerId/i);
  });

  it('DELETE /api-keys/:id codifica o id na URL', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchJson({ id: 'abc', revoked: true }),
    );
    await revokeApiKey('id/with/slash');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('id/with/slash')),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('createEscalationTicket', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchJson(
          {
            id: 't1',
            subject: 'S',
            priority: 'high',
            status: 'NEW',
            assignee: null,
            createdAt: new Date().toISOString(),
            timeline: [],
          },
          201,
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST /escalation/tickets com JSON', async () => {
    await createEscalationTicket({
      subject: 'Assunto',
      description: 'Detalhe',
      priority: 'high',
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/backend\/escalation\/tickets$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          subject: 'Assunto',
          description: 'Detalhe',
          priority: 'high',
        }),
      }),
    );
  });
});
