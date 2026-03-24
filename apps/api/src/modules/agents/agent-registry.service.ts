import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';

@Injectable()
export class AgentRegistryService {
  getAgentsByType(_type: AgentType): unknown[] {
    return [];
  }
}
