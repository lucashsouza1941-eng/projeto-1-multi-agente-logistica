import { Injectable, OnModuleInit } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { TriageAgentService } from '../../agents/triage-agent.service';
import { ReportAgentService } from '../../agents/report-agent.service';
import type { AgentMetadata } from './interfaces/agent.interface';

@Injectable()
export class AgentRegistryService implements OnModuleInit {
  private readonly registry = new Map<string, AgentMetadata>();

  constructor(
    private readonly triageAgent: TriageAgentService,
    private readonly reportAgent: ReportAgentService,
  ) {}

  onModuleInit(): void {
    this.syncFromServices();
  }

  /** Atualiza entradas a partir dos agentes registrados no módulo. */
  private syncFromServices(): void {
    const t = this.triageAgent.getStatus();
    this.register({
      id: 'triage',
      name: t.name,
      type: AgentType.TRIAGE,
      active: t.status === 'ONLINE' || t.status === 'PROCESSING',
      runtimeStatus: t.status,
      lastRunAt: t.lastRunAt?.toISOString() ?? null,
    });

    const r = this.reportAgent.getStatus();
    this.register({
      id: 'report',
      name: r.name,
      type: AgentType.REPORT,
      active: r.status === 'ONLINE' || r.status === 'PROCESSING',
      runtimeStatus: r.status,
      lastRunAt: r.lastRunAt?.toISOString() ?? null,
    });
  }

  register(agent: AgentMetadata): void {
    this.registry.set(agent.id, { ...agent });
  }

  unregister(id: string): boolean {
    return this.registry.delete(id);
  }

  getAll(): AgentMetadata[] {
    this.syncFromServices();
    return [...this.registry.values()];
  }

  getById(id: string): AgentMetadata | undefined {
    this.syncFromServices();
    return this.registry.get(id);
  }

  getActive(): AgentMetadata[] {
    this.syncFromServices();
    return [...this.registry.values()].filter((a) => a.active);
  }

  getAgentsByType(type: AgentType): AgentMetadata[] {
    this.syncFromServices();
    return [...this.registry.values()].filter((a) => a.type === type);
  }
}
