import { beforeEach, describe, expect, it } from 'vitest';
import { RulesEngineService } from './rules-engine.service';

describe('RulesEngineService', () => {
  let engine: RulesEngineService;

  beforeEach(() => {
    engine = new RulesEngineService();
  });

  it('match quando prioridade é HIGH', () => {
    expect(engine.evaluate({ priority: 'HIGH', category: 'ROUTINE' })).toEqual({
      match: true,
      ruleId: '1',
    });
  });

  it('match quando categoria é URGENT', () => {
    expect(engine.evaluate({ priority: 'LOW', category: 'URGENT' })).toEqual({
      match: true,
      ruleId: '1',
    });
  });

  it('sem match para prioridade média e categoria rotina', () => {
    expect(engine.evaluate({ priority: 'MEDIUM', category: 'ROUTINE' })).toEqual({
      match: false,
    });
  });
});
