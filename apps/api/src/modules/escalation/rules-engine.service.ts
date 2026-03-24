import { Injectable } from '@nestjs/common';

export interface RulesEngineInput {
  priority: string;
  category: string;
}

@Injectable()
export class RulesEngineService {
  evaluate(input: RulesEngineInput) {
    if (input.priority === 'HIGH' || input.category === 'URGENT') {
      return { match: true, ruleId: '1' };
    }
    return { match: false };
  }
}
