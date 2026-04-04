import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { LogErrorController } from './log-error.controller';

@Module({
  imports: [LoggerModule],
  controllers: [LogErrorController],
})
export class ClientLogModule {}
