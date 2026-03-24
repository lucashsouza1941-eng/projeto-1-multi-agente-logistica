export declare class RulesEngineService {
    evaluate(input: Record<string, unknown>): {
        match: boolean;
        ruleId?: string;
    };
}
