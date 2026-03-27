import type { AgentType } from '@prisma/client';

/** Contratos compartilhados para agentes (extensível) */
export interface AgentJobPayload {
  correlationId?: string;
  [key: string]: unknown;
}

/** Metadados do registry em memória (Triage, Report, etc.) */
export interface AgentMetadata {
  id: string;
  name: string;
  type: AgentType;
  active: boolean;
  runtimeStatus?: string;
  lastRunAt?: string | null;
}
