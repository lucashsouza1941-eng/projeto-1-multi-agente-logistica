import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Email } from '@prisma/client';
import { z } from 'zod';

export interface ReportGenerateParams {
  type: string;
  period: string;
}

export interface ReportFromEmailParams extends ReportGenerateParams {
  email: Email;
}

const reportStructuredSchema = z.object({
  title: z.string().describe('Título curto do relatório em português'),
  emailSummary: z.string().describe('Resumo do conteúdo do e-mail'),
  sentimentAnalysis: z.string().describe('Interpretação do tom e impacto no relacionamento'),
  recommendedAction: z.string().describe('Próximo passo recomendado para a equipe'),
  estimatedResponseTime: z
    .string()
    .describe(
      'Tempo estimado de resposta ou resolução (ex.: "2–4 horas úteis", "1 dia útil")',
    ),
});

type ReportStructured = z.infer<typeof reportStructuredSchema>;

export type ReportAgentContent = {
  emailSummary: string;
  sentimentAnalysis: string;
  recommendedAction: string;
  estimatedResponseTime: string;
  period: string;
  reportType: string;
  sourceEmailId: string;
  subject: string;
  triage?: {
    category: string;
    priority: string;
    sentiment?: string;
  };
};

@Injectable()
export class ReportAgentService {
  private readonly logger = new Logger(ReportAgentService.name);
  private status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' = 'ONLINE';
  private lastRunAt?: Date;

  constructor(private readonly config: ConfigService) {
    if (this.getOpenAIKey()) {
      this.status = 'ONLINE';
    }
  }

  private getOpenAIKey(): string | undefined {
    return (
      this.config.get<string>('OPENAI_API_KEY')?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      undefined
    );
  }

  private truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}…`;
  }

  private parseAgentDecision(email: Email): ReportAgentContent['triage'] | undefined {
    const raw = email.agentDecision;
    if (!raw || typeof raw !== 'object') return undefined;
    const o = raw as Record<string, unknown>;
    return {
      category: String(o.category ?? email.category),
      priority: String(o.priority ?? email.priority),
      sentiment:
        typeof o.sentiment === 'string' ? o.sentiment : undefined,
    };
  }

  private buildContent(
    structured: ReportStructured,
    params: ReportFromEmailParams,
  ): ReportAgentContent {
    return {
      emailSummary: structured.emailSummary,
      sentimentAnalysis: structured.sentimentAnalysis,
      recommendedAction: structured.recommendedAction,
      estimatedResponseTime: structured.estimatedResponseTime,
      period: params.period,
      reportType: params.type,
      sourceEmailId: params.email.id,
      subject: params.email.subject,
      triage: this.parseAgentDecision(params.email),
    };
  }

  /** Relatório simulado para demo sem API key */
  private mockGenerate(params: ReportFromEmailParams): {
    title: string;
    content: ReportAgentContent;
    status: 'COMPLETED';
  } {
    const triage = this.parseAgentDecision(params.email);
    const bodyExcerpt = this.truncate(params.email.body.replace(/\s+/g, ' ').trim(), 400);
    const sentiment =
      triage?.sentiment === 'negative'
        ? 'Tom crítico: cliente demonstra insatisfação; priorizar contato humano.'
        : triage?.sentiment === 'positive'
          ? 'Tom colaborativo: oportunidade de reforçar SLA e fidelização.'
          : 'Tom neutro-operacional: seguir fluxo padrão de registro e resposta.';

    const content: ReportAgentContent = {
      emailSummary: `Assunto: ${params.email.subject}. Trecho: ${bodyExcerpt}`,
      sentimentAnalysis: sentiment,
      recommendedAction:
        triage?.priority === 'HIGH'
          ? 'Acionar supervisor de operações e registrar ticket com prazo máximo de 2h.'
          : 'Registrar no sistema de ocorrências e responder com prazo consolidado ao remetente.',
      estimatedResponseTime:
        triage?.priority === 'HIGH'
          ? '2–4 horas úteis'
          : triage?.priority === 'MEDIUM'
            ? 'até 1 dia útil'
            : 'até 2 dias úteis',
      period: params.period,
      reportType: params.type,
      sourceEmailId: params.email.id,
      subject: params.email.subject,
      triage,
    };

    return {
      title: `Relatório ${params.type} — ${this.truncate(params.email.subject, 60)}`,
      content,
      status: 'COMPLETED',
    };
  }

  private async llmGenerate(params: ReportFromEmailParams): Promise<{
    title: string;
    content: ReportAgentContent;
    status: 'COMPLETED';
  }> {
    const modelName =
      this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';
    const llm = new ChatOpenAI({
      model: modelName,
      temperature: 0.2,
      maxRetries: 2,
      apiKey: this.getOpenAIKey(),
    });

    const structured = llm.withStructuredOutput(reportStructuredSchema, {
      name: 'logistics_email_report',
    });

    const triage = this.parseAgentDecision(params.email);
    const triageBlock = triage
      ? `Triagem atual: categoria=${triage.category}, prioridade=${triage.priority}${triage.sentiment ? `, sentimento=${triage.sentiment}` : ''}.`
      : `Triagem (campos do registro): categoria=${params.email.category}, prioridade=${params.email.priority}.`;

    const prompt = `Você gera relatórios operacionais curtos em português para uma equipe de logística.
Use os dados reais do e-mail e da triagem. O campo estimatedResponseTime deve ser uma faixa realista (horas ou dias úteis).

${triageBlock}

Período de referência do relatório: ${params.period}.
Tipo: ${params.type}.

Remetente: ${params.email.from}
Assunto: ${params.email.subject}

Corpo:
${this.truncate(params.email.body, 12000)}`;

    const parsed = await structured.invoke(prompt);
    return {
      title: parsed.title,
      content: this.buildContent(parsed, params),
      status: 'COMPLETED',
    };
  }

  /**
   * Geração enriquecida com e-mail + contexto de triagem (campos do próprio registro).
   * Persistência no banco fica a cargo do chamador (ex.: fila BullMQ).
   */
  async generateFromEmail(params: ReportFromEmailParams): Promise<{
    title: string;
    content: ReportAgentContent;
    status: 'COMPLETED';
  }> {
    this.status = 'PROCESSING';
    this.lastRunAt = new Date();

    try {
      if (!this.getOpenAIKey()) {
        const out = this.mockGenerate(params);
        this.status = 'ONLINE';
        return out;
      }
      const out = await this.llmGenerate(params);
      this.status = 'ONLINE';
      return out;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Relatório LLM falhou, usando mock: ${msg}`);
      const out = this.mockGenerate(params);
      this.status = 'ONLINE';
      return out;
    }
  }

  /** @deprecated Preferir generateFromEmail com dados do e-mail */
  async generate(params: ReportGenerateParams) {
    this.status = 'PROCESSING';
    this.lastRunAt = new Date();
    const content: ReportAgentContent = {
      emailSummary: `Relatório agregado (${params.type}) — período ${params.period}.`,
      sentimentAnalysis:
        'Sem e-mail fonte: análise de sentimento não aplicável neste modo legado.',
      recommendedAction: 'Chame generateFromEmail com o registro de Email para relatório contextualizado.',
      estimatedResponseTime: 'N/A',
      period: params.period,
      reportType: params.type,
      sourceEmailId: '',
      subject: '',
    };
    this.status = 'ONLINE';
    return {
      title: `Relatório ${params.type}`,
      content,
      status: 'COMPLETED' as const,
    };
  }

  getStatus() {
    return {
      name: 'Gerador de Relatórios',
      type: 'REPORT' as const,
      status: this.status,
      lastRunAt: this.lastRunAt,
    };
  }
}
