import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AUTH_PRIMARY_USER_SETTING_KEY } from '../modules/auth/auth.constants';

interface StoredPrimaryUser {
  email: string;
  passwordHash: string;
  name: string;
}

@Injectable()
export class OwnershipBackfillService implements OnModuleInit {
  private readonly logger = new Logger(OwnershipBackfillService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.run();
    } catch (e) {
      this.logger.error(
        `Ownership backfill failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async run(): Promise<void> {
    let user = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!user) {
      const row = await this.prisma.setting.findUnique({
        where: { key: AUTH_PRIMARY_USER_SETTING_KEY },
      });
      if (row?.value && typeof row.value === 'object' && row.value !== null) {
        const v = row.value as unknown as StoredPrimaryUser;
        if (v.email && v.passwordHash && v.name) {
          user = await this.prisma.user.create({
            data: {
              email: v.email.trim().toLowerCase(),
              passwordHash: v.passwordHash,
              name: v.name,
            },
          });
          this.logger.log(
            `Migrated legacy auth setting to User id=${user.id}`,
          );
        }
      }
    }

    if (!user) {
      return;
    }

    const [e, r, t, a] = await Promise.all([
      this.prisma.email.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      }),
      this.prisma.report.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      }),
      this.prisma.escalationTicket.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      }),
      this.prisma.agent.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      }),
    ]);

    const n = e.count + r.count + t.count + a.count;
    if (n > 0) {
      this.logger.log(`Backfilled userId on ${n} legacy row(s).`);
    }
  }
}
