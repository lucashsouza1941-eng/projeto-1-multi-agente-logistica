import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule } from './common/metrics/metrics.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmailModule } from './modules/email/email.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { QueuesModule } from './queues/queues.module';
import { AdminModule } from './modules/admin/admin.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ClientLogModule } from './modules/client-log/client-log.module';
import { ThrottlerUserGuard } from './common/guards/throttler-user.guard';
import appConfig from './config/app.config';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
              },
            },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60_000, limit: 10 },
      { name: 'llm', ttl: 60_000, limit: 5 },
      { name: 'jobs', ttl: 60_000, limit: 10 },
      { name: 'admin', ttl: 60_000, limit: 30 },
    ]),
    PrismaModule,
    HealthModule,
    QueuesModule,
    ClientLogModule,
    AdminModule,
    AuthModule,
    DashboardModule,
    EmailModule,
    AgentsModule,
    ReportsModule,
    EscalationModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    ThrottlerUserGuard,
  ],
})
export class AppModule {}
