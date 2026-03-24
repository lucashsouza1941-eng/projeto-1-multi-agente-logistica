export type AgentType = 'TRIAGE' | 'REPORT' | 'ESCALATION';
export interface AgentInput {
    email?: {
        subject: string;
        body: string;
        from: string;
    };
    parameters?: Record<string, unknown>;
    ticket?: Record<string, unknown>;
}
export interface AgentOutput {
    category?: string;
    priority?: string;
    confidence?: number;
    reasoning?: string;
    suggestedActions?: string[];
    content?: unknown;
    decision?: string;
}
export interface AgentStatus {
    name: string;
    type: AgentType;
    status: 'ONLINE' | 'OFFLINE' | 'PROCESSING';
    lastRunAt?: Date;
}
export interface AgentConfig {
    confidenceThreshold?: number;
    [key: string]: unknown;
}
export interface IAgent {
    readonly name: string;
    readonly type: AgentType;
    process(input: AgentInput): Promise<AgentOutput>;
    getStatus(): AgentStatus;
    configure(config: AgentConfig): void;
}
