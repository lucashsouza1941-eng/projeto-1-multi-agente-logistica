import { Module } from '@nestjs/common';
import { QueuesModule } from '../../queues/queues.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [QueuesModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
