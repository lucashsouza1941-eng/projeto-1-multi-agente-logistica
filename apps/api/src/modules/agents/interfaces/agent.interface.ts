/** Contratos compartilhados para agentes (extensível) */
export interface AgentJobPayload {
  correlationId?: string;
  [key: string]: unknown;
}
