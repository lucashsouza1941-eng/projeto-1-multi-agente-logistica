import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AlertLevel = 'critical' | 'warning';

export type AlertPayload = {
  level: AlertLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
};

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly config: ConfigService) {}

  async send(
    level: AlertLevel,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const url = this.config.get<string>('ALERT_WEBHOOK_URL')?.trim();
    const payload: AlertPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    this.logger.log(
      `[alert:${level}] ${message}${context ? ` ${JSON.stringify(context)}` : ''}`,
    );
    if (!url) {
      return;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.warn(
          `Webhook alert falhou: HTTP ${res.status} ${res.statusText}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `Webhook alert erro: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
