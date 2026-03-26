import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailCategory, EmailPriority } from '@prisma/client';
import { z } from 'zod';

export interface TriageEmailInput {
  subject: string;
  body: string;
  from: string;
}

export type TriageSentiment = 'positive' | 'neutral' | 'negative';

export interface TriageResult {
  category: EmailCategory;
  priority: EmailPriority;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  sentiment: TriageSentiment;
  /** Resumo curto (LLM ou mock); espelha `summary` estruturado quando disponível */
  summary?: string;
}

const triageStructuredSchema = z.object({
  category: z.nativeEnum(EmailCategory),
  priority: z.nativeEnum(EmailPriority),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  summary: z
    .string()
    .describe('Resumo objetivo do e-mail em português (1–3 frases)'),
  suggestedAction: z
    .string()
    .describe('Uma ação operacional recomendada em português'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confiança na classificação de 0 a 100'),
});

type TriageStructured = z.infer<typeof triageStructuredSchema>;

@Injectable()
export class TriageAgentService {
  private readonly logger = new Logger(TriageAgentService.name);
  private status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' = 'ONLINE';
  private confidenceThreshold = 85;
  private lastRunAt?: Date;

  constructor(private readonly config: ConfigService) {
    const key = this.getOpenAIKey();
    this.status = key ? 'ONLINE' : 'OFFLINE';
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

  private inferSentiment(text: string): TriageSentiment {
    const neg =
      /reclama|problema|atraso|insatisfeito|urgente|péssimo|cancelar|devolução|danif|erro/i.test(
        text,
      );
    const pos =
      /obrigad|parabéns|excelente|perfeito|ótimo|satisf|agradec/i.test(text);
    if (neg) return 'negative';
    if (pos) return 'positive';
    return 'neutral';
  }

  /** Fallback determinístico quando o LLM falha */
  private heuristicProcess(email: TriageEmailInput): TriageResult {
    const lower = `${email.subject} ${email.body}`.toLowerCase();
    const isUrgent =
      lower.includes('urgente') ||
      lower.includes('atraso') ||
      lower.includes('crítico');
    const isSpam =
      lower.includes('desconto') ||
      lower.includes('promoção') ||
      /no-reply@/.test(email.from);
    const isActionRequired =
      lower.includes('proposta') ||
      lower.includes('aprovação') ||
      lower.includes('documentação');

    let category: EmailCategory = EmailCategory.ROUTINE;
    let priority: EmailPriority = EmailPriority.LOW;
    if (isUrgent) {
      category = EmailCategory.URGENT;
      priority = EmailPriority.HIGH;
    } else if (isSpam) {
      category = EmailCategory.SPAM;
    } else if (isActionRequired) {
      category = EmailCategory.ACTION_REQUIRED;
      priority = EmailPriority.MEDIUM;
    }
    const confidence = isUrgent ? 94 : isSpam ? 99 : 87;
    const sentiment = this.inferSentiment(lower);
    const summary = this.truncate(
      `${email.subject}: ${email.body}`.replace(/\s+/g, ' ').trim(),
      280,
    );
    return {
      category,
      priority,
      confidence,
      summary,
      reasoning:
        'Classificação de contingência (heurística por palavras-chave) após falha do modelo.',
      suggestedActions:
        category === EmailCategory.URGENT
          ? ['Escalonar para gerência']
          : category === EmailCategory.SPAM
            ? ['Mover para spam']
            : ['Arquivar ou responder em até 24h'],
      sentiment,
    };
  }

  /** Demo sem custo de API: saída estável e plausível */
  private mockProcess(email: TriageEmailInput): TriageResult {
    const lower = `${email.subject} ${email.body}`.toLowerCase();
    const seed = (email.subject.length + email.body.length) % 5;
    const isUrgent =
      lower.includes('urgente') ||
      lower.includes('atraso') ||
      lower.includes('sinistro');
    const category = isUrgent
      ? EmailCategory.URGENT
      : seed === 0
        ? EmailCategory.ACTION_REQUIRED
        : EmailCategory.ROUTINE;
    const priority = isUrgent
      ? EmailPriority.HIGH
      : category === EmailCategory.ACTION_REQUIRED
        ? EmailPriority.MEDIUM
        : EmailPriority.LOW;
    const sentiment = this.inferSentiment(lower);
    const summary = `Solicitação logística relacionada a "${this.truncate(email.subject, 80)}". O remetente (${email.from}) aborda pontos operacionais que exigem acompanhamento pela equipe.`;
    return {
      category,
      priority,
      confidence: isUrgent ? 91 : 86,
      summary,
      reasoning:
        'Análise simulada (modo demonstração sem OPENAI_API_KEY). Ative a API para classificação com LangChain.',
      suggestedActions: [
        isUrgent
          ? 'Priorizar contato com operações e atualizar SLA ao cliente em até 2h.'
          : 'Registrar no TMS e responder com prazo estimado consolidado.',
      ],
      sentiment,
    };
  }

  private structuredToResult(parsed: TriageStructured): TriageResult {
    return {
      category: parsed.category,
      priority: parsed.priority,
      confidence: Math.round(parsed.confidence * 10) / 10,
      summary: parsed.summary,
      reasoning: parsed.summary,
      suggestedActions: [parsed.suggestedAction],
      sentiment: parsed.sentiment,
    };
  }

  private async llmProcess(email: TriageEmailInput): Promise<TriageResult> {
    const modelName =
      this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';
    const llm = new ChatOpenAI({
      model: modelName,
      temperature: 0,
      maxRetries: 2,
      apiKey: this.getOpenAIKey(),
    });

    const structured = llm.withStructuredOutput(triageStructuredSchema, {
      name: 'triage_logistics_email',
    });

    const prompt = `Você é um analista de triagem de e-mails para operações logísticas no Brasil.
Classifique o e-mail usando apenas os valores de enum permitidos.
- category: URGENT (risco operacional, prazo crítico, sinistro), ROUTINE (rotina), SPAM (promoção irrelevante), ACTION_REQUIRED (precisa decisão/aprovação).
- priority: HIGH se impacto imediato em cliente ou carga; MEDIUM para prazos comerciais; LOW para informativos.
- sentiment: tom do remetente (positive / neutral / negative).
- summary: resumo fiel em português.
- suggestedAction: uma linha, verbo no imperativo, acionável pela equipe.
- confidence: sua confiança agregada 0–100.

---
Remetente: ${email.from}
Assunto: ${email.subject}

Corpo:
${this.truncate(email.body, 12000)}`;

    const parsed = await structured.invoke(prompt);
    return this.structuredToResult(parsed);
  }

  async process(email: TriageEmailInput): Promise<TriageResult> {
    this.status = 'PROCESSING';
    this.lastRunAt = new Date();

    try {
      if (!this.getOpenAIKey()) {
        const out = this.mockProcess(email);
        this.status = 'ONLINE';
        return out;
      }
      const out = await this.llmProcess(email);
      this.status = 'ONLINE';
      return out;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Triagem LLM falhou, usando heurística: ${msg}`);
      const out = this.heuristicProcess(email);
      this.status = 'ONLINE';
      return out;
    }
  }

  getStatus() {
    return {
      name: 'Triagem de E-mails',
      type: 'TRIAGE' as const,
      status: this.status,
      lastRunAt: this.lastRunAt,
    };
  }

  configure(config: { confidenceThreshold?: number }) {
    if (config.confidenceThreshold != null) {
      this.confidenceThreshold = config.confidenceThreshold;
    }
  }
}
