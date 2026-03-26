import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentRegistryService } from './agent-registry.service';
import { TriageAgentService } from '../../agents/triage-agent.service';
import { ReportAgentService } from '../../agents/report-agent.service';
import { EscalationAgentService } from '../../langchain/escalation-agent.service';

@Module({
  controllers: [AgentsController],
  providers: [
    AgentsService,
    AgentRegistryService,
    TriageAgentService,
    ReportAgentService,
    EscalationAgentService,
  ],
  exports: [
    AgentsService,
    AgentRegistryService,
    TriageAgentService,
    ReportAgentService,
    EscalationAgentService,
  ],
})
export class AgentsModule {}
