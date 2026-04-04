import { Injectable } from '@nestjs/common';

/** Amostra global para taxa 5xx na última hora e média global das últimas 100 respostas. */
export type HttpGlobalSample = { ts: number; status: number; latencyMs: number };

@Injectable()
export class HttpMetricsService {
  private readonly globalWindow: HttpGlobalSample[] = [];
  private readonly perRouteLatencies = new Map<string, number[]>();
  private readonly maxRouteSamples = 100;
  private readonly globalRetentionMs = 3_700_000;

  recordRequest(routeKey: string, status: number, latencyMs: number): void {
    const ts = Date.now();
    this.globalWindow.push({ ts, status, latencyMs });
    this.trimGlobal();

    const ring = this.perRouteLatencies.get(routeKey) ?? [];
    ring.push(latencyMs);
    if (ring.length > this.maxRouteSamples) {
      ring.splice(0, ring.length - this.maxRouteSamples);
    }
    this.perRouteLatencies.set(routeKey, ring);
  }

  private trimGlobal(): void {
    const cutoff = Date.now() - this.globalRetentionMs;
    while (this.globalWindow.length > 0 && this.globalWindow[0].ts < cutoff) {
      this.globalWindow.shift();
    }
    while (this.globalWindow.length > 10_000) {
      this.globalWindow.shift();
    }
  }

  /** Taxa de 5xx na última hora (amostras HTTP registadas em memória — não lê ficheiros de log). */
  getFivexxRateLastHour(): { rate: number; total: number; errors5xx: number } {
    const hourAgo = Date.now() - 3_600_000;
    const recent = this.globalWindow.filter((r) => r.ts >= hourAgo);
    const total = recent.length;
    const errors5xx = recent.filter((r) => r.status >= 500).length;
    const rate = total === 0 ? 0 : errors5xx / total;
    return { rate, total, errors5xx };
  }

  /** Média das últimas 100 respostas (global). */
  getAvgLatencyMsLast100Global(): number | null {
    const last = this.globalWindow.slice(-100);
    if (!last.length) return null;
    const sum = last.reduce((a, b) => a + b.latencyMs, 0);
    return Math.round(sum / last.length);
  }

  /** Últimas até 100 latências por rota (path normalizado). */
  getAvgLatencyMsByRoute(): Record<
    string,
    { avgMs: number | null; samples: number }
  > {
    const out: Record<string, { avgMs: number | null; samples: number }> = {};
    for (const [route, vals] of this.perRouteLatencies) {
      const n = vals.length;
      const avg = n ? vals.reduce((a, b) => a + b, 0) / n : null;
      out[route] = {
        avgMs: avg !== null ? Math.round(avg) : null,
        samples: n,
      };
    }
    return out;
  }
}
