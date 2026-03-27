import { getToken } from './auth';

const directBase = () =>
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001');

const connectionHint =
  'Verifique se a API está rodando (pnpm dev:api na porta 3001), se o Docker está no ar (pnpm docker:up) e se o banco foi migrado (pnpm api:migrate).';

function requestUrl(pathWithQuery: string): string {
  if (typeof window !== 'undefined') {
    return `/api/backend${pathWithQuery}`;
  }
  return `${directBase()}${pathWithQuery}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = requestUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = await getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
      credentials: typeof window !== 'undefined' ? 'include' : undefined,
    });
  } catch (e) {
    const isNetwork =
      e instanceof TypeError ||
      (e instanceof Error && e.message === 'Failed to fetch');
    if (isNetwork) {
      throw new Error(`Sem conexão com a API (${directBase()}). ${connectionHint}`);
    }
    throw e;
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
    const text = await res.text();
    throw new Error(text || 'Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type DashboardPeriod = 'today' | '7d' | '30d' | 'custom';

export interface DashboardKpis {
  emailsProcessed: number;
  emailsProcessedToday: number;
  emailsProcessedWeek: number;
  emailsProcessedMonth: number;
  triageAccuracyPercent: number;
  reportsGenerated: number;
  ticketsEscalated: number;
  /** Agentes com status ONLINE ou PROCESSING */
  agentsOnline: number;
  /** E-mails aguardando triagem */
  emailsPending: number;
  avgProcessingTimeMs: number;
  period: string;
}

export function getDashboardKpis(period: DashboardPeriod = "7d") {
  return fetchJson<DashboardKpis>(
    `/dashboard/kpis?period=${encodeURIComponent(period)}`,
  );
}

export interface DashboardActivityItem {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: string;
}

export function getDashboardActivity(limit = 50) {
  return fetchJson<DashboardActivityItem[]>(`/dashboard/activity?limit=${limit}`);
}

export interface VolumeChartResponse {
  granularity: string;
  data: { label: string; value: number }[];
}

export function getDashboardVolume(granularity = 'hour') {
  return fetchJson<VolumeChartResponse>(
    `/dashboard/charts/volume?granularity=${encodeURIComponent(granularity)}`,
  );
}

export interface CategoryDistributionItem {
  category: string;
  label: string;
  count: number;
}

export function getDashboardCategories() {
  return fetchJson<CategoryDistributionItem[]>('/dashboard/charts/categories');
}

export interface ApiAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  lastRunAt: string | null;
  totalProcessed: number;
  successRate: number;
  metrics: Record<string, number>;
}

export function getAgents() {
  return fetchJson<ApiAgent[]>('/agents');
}

export interface EmailListFilters {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
}

export interface EmailDto {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  category: string;
  priority: string;
  confidence: number;
  actionTaken: string;
  date: string;
  preview: string;
  aiReasoning: string;
}

export interface EmailListResponse {
  data: EmailDto[];
  total: number;
  page: number;
  limit: number;
}

export function getEmails(filters: EmailListFilters = {}) {
  const p = new URLSearchParams();
  if (filters.page != null) p.set('page', String(filters.page));
  if (filters.limit != null) p.set('limit', String(filters.limit));
  if (filters.category) p.set('category', filters.category);
  if (filters.sort) p.set('sort', filters.sort);
  const qs = p.toString();
  return fetchJson<EmailListResponse>(`/emails${qs ? `?${qs}` : ''}`);
}

export interface ReportListItem {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  generatedBy: string;
  period: string;
  summary?: string;
}

export function getReports(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetchJson<ReportListItem[]>(`/reports${q}`);
}

export function createReport(body: {
  title: string;
  type: string;
  period?: string;
  parameters?: Record<string, unknown>;
}) {
  return fetchJson<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }>('/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function regenerateReport(id: string) {
  return fetchJson<{ id: string; status: string; message: string }>(
    `/reports/${encodeURIComponent(id)}/regenerate`,
    { method: 'POST' },
  );
}

export interface EscalationTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  assignee: string | null;
  createdAt: string;
  timeline: unknown[];
}

export function getEscalationTickets(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetchJson<EscalationTicket[]>(`/escalation/tickets${q}`);
}

export function updateTicketStatus(id: string, status: string) {
  return fetchJson<{ id: string; status: string; updated: boolean }>(
    `/escalation/tickets/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
}
