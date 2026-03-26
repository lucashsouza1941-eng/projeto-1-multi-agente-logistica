import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgentsModule } from '../modules/agents/agents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailTriageProcessor } from '../email-triage/email-triage.processor';
import { ReportGenerationProcessor } from './report-generation.processor';

@Module({
  imports: [
    PrismaModule,
    AgentsModule,
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
    ),
  ],
  providers: [EmailTriageProcessor, ReportGenerationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
