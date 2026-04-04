import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { HttpMetricsService } from '../../common/metrics/http-metrics.service';
import { HealthCheckService } from '../health/health-check.service';
import { AlertService } from './alert.service';

const TICK_MS = 60_000;
const COOLDOWN_HEALTH_MS = 5 * 60_000;
const COOLDOWN_QUEUE_WAIT_MS = 15 * 60_000;
const COOLDOWN_5XX_MS = 10 * 60_000;
const COOLDOWN_LATENCY_MS = 15 * 60_000;
const WAITING_THRESHOLD = 50;
const FIVEXX_RATE_THRESHOLD = 0.05;
const MIN_SAMPLES_FOR_5XX = 20;
const LATENCY_WARNING_MS = 2000;

@Injectable()
export class AlertMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertMonitorService.name);
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly lastSent = new Map<string, number>();

  constructor(
    private readonly healthCheck: HealthCheckService,
    private readonly httpMetrics: HttpMetricsService,
    private readonly alerts: AlertService,
    @InjectQueue('email-triage') private readonly emailTriage: Queue,
    @InjectQueue('report-generation') private readonly reportGen: Queue,
    @InjectQueue('escalation-processing') private readonly escalationProc: Queue,
  ) {}

  onModuleInit(): void {
    void this.tick();
    this.timer = setInterval(() => {
      void this.tick().catch((e) =>
        this.logger.error(e instanceof Error ? e.message : String(e)),
      );
    }, TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private canSend(key: string, cooldownMs: number): boolean {
    const now = Date.now();
    const last = this.lastSent.get(key) ?? 0;
    if (now - last < cooldownMs) {
      return false;
    }
    this.lastSent.set(key, now);
    return true;
  }

  private async tick(): Promise<void> {
    const health = await this.healthCheck.check();
    if (health.status !== 'ok') {
      const key =
        health.status === 'down' ? 'health:down' : 'health:degraded';
      if (this.canSend(key, COOLDOWN_HEALTH_MS)) {
        await this.alerts.send(
          'critical',
          `Healthcheck ${health.status}: db=${health.checks.db} redis=${health.checks.redis}`,
          { status: health.status, checks: health.checks },
        );
      }
    }

    const queues: { name: string; q: Queue }[] = [
      { name: 'email-triage', q: this.emailTriage },
      { name: 'report-generation', q: this.reportGen },
      { name: 'escalation-processing', q: this.escalationProc },
    ];
    for (const { name, q } of queues) {
      const counts = await q.getJobCounts();
      if (counts.waiting > WAITING_THRESHOLD) {
        const k = `queue:waiting:${name}`;
        if (this.canSend(k, COOLDOWN_QUEUE_WAIT_MS)) {
          await this.alerts.send(
            'warning',
            `Fila ${name} com ${counts.waiting} jobs em waiting (> ${WAITING_THRESHOLD})`,
            { queue: name, waiting: counts.waiting },
          );
        }
      }
    }

    const { rate, total, errors5xx } = this.httpMetrics.getFivexxRateLastHour();
    if (total >= MIN_SAMPLES_FOR_5XX && rate > FIVEXX_RATE_THRESHOLD) {
      if (this.canSend('http:5xx-rate', COOLDOWN_5XX_MS)) {
        await this.alerts.send(
          'critical',
          `Taxa 5xx ${(rate * 100).toFixed(2)}% na última hora (>${FIVEXX_RATE_THRESHOLD * 100}%)`,
          { rate, total, errors5xx },
        );
      }
    }

    const avg = this.httpMetrics.getAvgLatencyMsLast100Global();
    if (avg !== null && avg > LATENCY_WARNING_MS) {
      if (this.canSend('http:latency', COOLDOWN_LATENCY_MS)) {
        await this.alerts.send(
          'warning',
          `Latência média global (últimas 100 respostas) ${avg}ms (>${LATENCY_WARNING_MS}ms)`,
          { avgLatencyMs: avg },
        );
      }
    }
  }
}
