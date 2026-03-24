import { Module } from '@nestjs/common';
import { EscalationController } from './escalation.controller';
import { EscalationService } from './escalation.service';
import { RulesEngineService } from './rules-engine.service';

@Module({
  controllers: [EscalationController],
  providers: [EscalationService, RulesEngineService],
  exports: [EscalationService],
})
export class EscalationModule {}
