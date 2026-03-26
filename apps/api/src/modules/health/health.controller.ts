import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createClient } from 'redis';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check (DB + Redis)' })
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'Dependency unavailable' })
  async check() {
    let dbOk = true;
    let dbError: string | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbOk = false;
      dbError = e instanceof Error ? e.message : String(e);
    }

    let redisOk = true;
    let redisError: string | undefined;
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl });
    try {
      await client.connect();
      await client.ping();
      await client.quit();
    } catch (e) {
      redisOk = false;
      redisError = e instanceof Error ? e.message : String(e);
      try {
        await client.quit();
      } catch {
        /* ignore */
      }
    }

    if (!dbOk || !redisOk) {
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          db: dbOk ? 'ok' : (dbError ?? 'unavailable'),
          redis: redisOk ? 'ok' : (redisError ?? 'unavailable'),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'ok',
      redis: 'ok',
      agents: 'ok',
    };
  }
}
