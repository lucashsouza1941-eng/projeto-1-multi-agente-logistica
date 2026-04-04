import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ThrottlerUserGuard } from '../../common/guards/throttler-user.guard';
import { HttpMetricsService } from '../../common/metrics/http-metrics.service';

async function avgProcessingMsLast100(queue: Queue): Promise<number | null> {
  const jobs = await queue.getJobs(['completed'], 0, 99, true);
  if (!jobs.length) return null;
  let sum = 0;
  let n = 0;
  for (const j of jobs) {
    const finished = j.finishedOn;
    const processed = j.processedOn;
    if (finished && processed && finished > processed) {
      sum += finished - processed;
      n += 1;
    }
  }
  return n ? Math.round(sum / n) : null;
}

/** Jobs concluídos / falhos nas últimas 24h (amostra até 1000 jobs por estado; removeOnComplete pode limitar histórico). */
async function jobsLast24h(queue: Queue): Promise<{ completed: number; failed: number }> {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const [completedJobs, failedJobs] = await Promise.all([
    queue.getJobs(['completed'], 0, 999, true),
    queue.getJobs(['failed'], 0, 999, true),
  ]);
  let completed = 0;
  for (const j of completedJobs) {
    if (j.finishedOn && j.finishedOn >= since) completed += 1;
  }
  let failed = 0;
  for (const j of failedJobs) {
    if (j.finishedOn && j.finishedOn >= since) failed += 1;
  }
  return { completed, failed };
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(RolesGuard, ThrottlerUserGuard)
@Roles('admin')
@ApiHeader({ name: 'authorization', required: true })
export class AdminController {
  constructor(
    @InjectQueue('email-triage') private readonly emailTriage: Queue,
    @InjectQueue('report-generation') private readonly reportGen: Queue,
    @InjectQueue('escalation-processing') private readonly escalationProc: Queue,
    @InjectQueue('failed-jobs') private readonly failedJobs: Queue,
    @Inject(HttpMetricsService) private readonly httpMetrics: HttpMetricsService,
  ) {}

  private sourceQueue(name: string): Queue {
    if (name === 'email-triage') return this.emailTriage;
    if (name === 'report-generation') return this.reportGen;
    if (name === 'escalation-processing') return this.escalationProc;
    throw new BadRequestException(`Fila de origem inválida: ${name}`);
  }

  @Get('failed-jobs')
  @Throttle({ admin: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Jobs falhos (filas de origem + DLQ)' })
  @ApiResponse({ status: 200 })
  async failedJobsList() {
    const [triageFailed, reportFailed, escalationFailed, dlqWaiting, dlqFailed] = await Promise.all([
      this.emailTriage.getJobs(['failed'], 0, 49),
      this.reportGen.getJobs(['failed'], 0, 49),
      this.escalationProc.getJobs(['failed'], 0, 49),
      this.failedJobs.getJobs(['waiting', 'delayed'], 0, 49),
      this.failedJobs.getJobs(['failed'], 0, 49),
    ]);
    return {
      emailTriage: triageFailed.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
      })),
      reportGeneration: reportFailed.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
      })),
      escalationProcessing: escalationFailed.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
      })),
      dlq: [...dlqWaiting, ...dlqFailed].map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
      })),
    };
  }

  @Get('metrics')
  @Throttle({ admin: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Contagens por fila (waiting, active, completed, failed)' })
  @ApiResponse({ status: 200 })
  async metrics() {
    const [
      triage,
      report,
      escalation,
      dlq,
      triageAvg,
      reportAvg,
      escalationAvg,
      triage24,
      report24,
      esc24,
    ] = await Promise.all([
      this.emailTriage.getJobCounts(),
      this.reportGen.getJobCounts(),
      this.escalationProc.getJobCounts(),
      this.failedJobs.getJobCounts(),
      avgProcessingMsLast100(this.emailTriage),
      avgProcessingMsLast100(this.reportGen),
      avgProcessingMsLast100(this.escalationProc),
      jobsLast24h(this.emailTriage),
      jobsLast24h(this.reportGen),
      jobsLast24h(this.escalationProc),
    ]);
    const fivexx = this.httpMetrics.getFivexxRateLastHour();
    const httpByRoute = this.httpMetrics.getAvgLatencyMsByRoute();
    const avgGlobal100 = this.httpMetrics.getAvgLatencyMsLast100Global();
    return {
      triage: { ...triage, avgProcessingMsLast100: triageAvg },
      report: { ...report, avgProcessingMsLast100: reportAvg },
      escalation: { ...escalation, avgProcessingMsLast100: escalationAvg },
      failedJobsQueue: dlq,
      avgProcessingMsLast100: {
        triage: triageAvg,
        report: reportAvg,
        escalation: escalationAvg,
      },
      http: {
        fivexxRateLastHour: fivexx.rate,
        fivexxTotalSamplesLastHour: fivexx.total,
        fivexxCountLastHour: fivexx.errors5xx,
        avgLatencyMsLast100Global: avgGlobal100,
        avgLatencyMsLast100ByRoute: httpByRoute,
        note:
          'Métricas HTTP em memória (processo atual). Taxa 5xx com base em respostas registadas pelo interceptor, não em ficheiros de log.',
      },
      api: {
        uptimeSeconds: Math.round(process.uptime()),
      },
      queuesLast24h: {
        emailTriage: triage24,
        reportGeneration: report24,
        escalationProcessing: esc24,
      },
    };
  }

  @Post('failed-jobs/:id/retry')
  @Throttle({ admin: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reprocessar um job específico da DLQ' })
  @ApiResponse({ status: 200, description: 'Job reenfileirado na fila original' })
  @ApiResponse({ status: 404, description: 'Job não encontrado na DLQ' })
  async retryFailedJob(@Param('id') id: string) {
    const dlqJob = await this.failedJobs.getJob(id);
    if (!dlqJob) {
      throw new NotFoundException('Job não encontrado na DLQ');
    }
    const payload = dlqJob.data as {
      sourceQueue?: string;
      jobName?: string;
      data?: unknown;
      originalJobId?: string;
    };
    if (!payload?.sourceQueue || !payload?.jobName) {
      throw new BadRequestException('Payload da DLQ inválido para retry');
    }
    const queue = this.sourceQueue(payload.sourceQueue);
    const retry = await queue.add(
      payload.jobName,
      payload.data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 200,
      },
    );
    await dlqJob.remove().catch(() => undefined);
    return {
      retried: true,
      dlqJobId: id,
      sourceQueue: payload.sourceQueue,
      originalJobId: payload.originalJobId ?? null,
      newJobId: retry.id,
    };
  }

  @Delete('failed-jobs')
  @Throttle({ admin: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Limpar a fila de DLQ (failed-jobs)' })
  @ApiResponse({ status: 200, description: 'DLQ limpa' })
  async clearFailedJobs() {
    const before = await this.failedJobs.getJobCounts();
    await this.failedJobs.obliterate({ force: true });
    return { cleared: true, previousCounts: before };
  }
}
