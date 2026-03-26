import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailCategory, EmailPriority } from '@prisma/client';

export interface TriageEmailInput {
  subject: string;
  body: string;
  from: string;
}

export interface TriageResult {
  category: EmailCategory;
  priority: EmailPriority;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
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
