import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EscalationEvaluateInput {
  priority: string;
  category: string;
}

@Injectable()
export class EscalationAgentService {
  private status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' = 'ONLINE';
  private lastRunAt?: Date;

  constructor(_config: ConfigService) {}

  async evaluate(input: EscalationEvaluateInput) {
    this.status = 'PROCESSING';
    this.lastRunAt = new Date();
    const escalate = input.priority === 'HIGH' || input.category === 'URGENT';
    const ruleId = escalate ? '1' : undefined;
    this.status = 'ONLINE';
    return {
      escalate,
      reason: escalate ? 'Prioridade alta ou categoria urgente' : undefined,
      ruleId,
    };
  }

  getStatus() {
    return {
      name: 'Escalonamento',
      type: 'ESCALATION' as const,
      status: this.status,
      lastRunAt: this.lastRunAt,
    };
  }
}
