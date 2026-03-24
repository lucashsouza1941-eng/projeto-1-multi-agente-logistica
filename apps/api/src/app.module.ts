import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmailModule } from './modules/email/email.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { QueuesModule } from './queues/queues.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
    HealthModule,
    QueuesModule,
    AuthModule,
    DashboardModule,
    EmailModule,
    AgentsModule,
    ReportsModule,
    EscalationModule,
    SettingsModule,
  ],
})
export class AppModule {}
