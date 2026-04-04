import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgentsModule } from '../modules/agents/agents.module';
import { AlertsModule } from '../modules/alerts/alerts.module';
import { AlertMonitorService } from '../modules/alerts/alert-monitor.service';
import { HealthModule } from '../modules/health/health.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailTriageProcessor } from '../email-triage/email-triage.processor';
import { ReportGenerationProcessor } from './report-generation.processor';
import { DlqForwarderService } from './dlq-forwarder.service';
import { EscalationProcessingProcessor } from './escalation-processing.processor';

@Module({
  imports: [
    PrismaModule,
    AgentsModule,
    HealthModule,
    AlertsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email-triage' },
      { name: 'report-generation' },
      { name: 'escalation-processing' },
      { name: 'failed-jobs' },
    ),
  ],
  providers: [
    EmailTriageProcessor,
    ReportGenerationProcessor,
    EscalationProcessingProcessor,
    DlqForwarderService,
    AlertMonitorService,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
