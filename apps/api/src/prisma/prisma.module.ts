import { Global, Module } from '@nestjs/common';
import { OwnershipBackfillService } from './ownership-backfill.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, OwnershipBackfillService],
  exports: [PrismaService],
})
export class PrismaModule {}
