import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ReportGenerateParams {
  type: string;
  period: string;
}

@Injectable()
export class ReportAgentService {
  private status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' = 'ONLINE';
  private lastRunAt?: Date;

  constructor(private readonly config: ConfigService) {
    if (this.config.get<string>('OPENAI_API_KEY')) {
      this.status = 'ONLINE';
    }
  }

  async generate(params: ReportGenerateParams) {
    this.status = 'PROCESSING';
    this.lastRunAt = new Date();
    const content = {
      summary: `Relatório ${params.type} - Período: ${params.period}. Dados agregados do banco.`,
      sections: [{ title: 'Resumo Executivo', body: 'Taxa de processamento estável. 94.2% de acurácia na triagem.' }],
    };
    this.status = 'ONLINE';
    return { title: `Relatório ${params.type}`, content, status: 'COMPLETED' as const };
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
