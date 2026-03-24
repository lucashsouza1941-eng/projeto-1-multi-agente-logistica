import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailTriageProcessor } from './email-triage.processor';
import { ReportGenerationProcessor } from './report-generation.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'email-triage' }, { name: 'report-generation' }),
  ],
  providers: [EmailTriageProcessor, ReportGenerationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
