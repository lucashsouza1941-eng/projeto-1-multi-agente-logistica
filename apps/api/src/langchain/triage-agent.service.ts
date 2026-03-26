import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailCategory, EmailPriority } from '@prisma/client';

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
}

@Injectable()
export class TriageAgentService {
  private status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' = 'ONLINE';
  private confidenceThreshold = 85;
  private lastRunAt?: Date;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.status = key ? 'ONLINE' : 'OFFLINE';
  }

  private inferSentiment(text: string): TriageSentiment {
    const neg =
      /reclama|problema|atraso|insatisfeito|urgente|péssimo|cancelar|devolução|danif|erro/i.test(text);
    const pos =
      /obrigad|parabéns|excelente|perfeito|ótimo|satisf|agradec/i.test(text);
    if (neg) return 'negative';
    if (pos) return 'positive';
    return 'neutral';
  }

  async process(email: TriageEmailInput): Promise<TriageResult> {
    this.status = 'PROCESSING';
    this.lastRunAt = new Date();
    const lower = `${email.subject} ${email.body}`.toLowerCase();
    const isUrgent = lower.includes('urgente') || lower.includes('atraso') || lower.includes('crítico');
    const isSpam = lower.includes('desconto') || lower.includes('promoção') || /no-reply@/.test(email.from);
    const isActionRequired =
      lower.includes('proposta') || lower.includes('aprovação') || lower.includes('documentação');

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
    const hasKey = !!this.config.get<string>('OPENAI_API_KEY');
    const sentiment = this.inferSentiment(lower);
    this.status = 'ONLINE';
    return {
      category,
      priority,
      confidence,
      reasoning: `Classificação baseada em palavras-chave e remetente.${hasKey ? ' (LangChain/OpenAI disponível)' : ' (modo heurístico)'}`,
      suggestedActions:
        category === EmailCategory.URGENT
          ? ['Escalonar para gerência']
          : category === EmailCategory.SPAM
            ? ['Mover para spam']
            : ['Arquivar'],
      sentiment,
    };
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
    if (config.confidenceThreshold != null) this.confidenceThreshold = config.confidenceThreshold;
  }
}
