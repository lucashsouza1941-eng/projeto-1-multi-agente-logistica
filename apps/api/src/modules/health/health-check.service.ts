import { Inject, Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import { PrismaService } from '../../prisma/prisma.service';

type CheckState = 'ok' | 'down';

export type HealthAggregateResult = {
  status: 'ok' | 'degraded' | 'down';
  checks: { db: CheckState; redis: CheckState };
  timestamp: string;
};

@Injectable()
export class HealthCheckService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(): Promise<HealthAggregateResult> {
    let db: CheckState = 'ok';
    let redis: CheckState = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl });
    try {
      await client.connect();
      await client.ping();
    } catch {
      redis = 'down';
    } finally {
      try {
        await client.quit();
      } catch {
        /* ignore */
      }
    }

    const status =
      db === 'ok' && redis === 'ok'
        ? 'ok'
        : db === 'down' && redis === 'down'
          ? 'down'
          : 'degraded';

    return {
      status,
      checks: { db, redis },
      timestamp: new Date().toISOString(),
    };
  }
}
