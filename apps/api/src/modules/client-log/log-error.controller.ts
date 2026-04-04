import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Public } from '../auth/public.decorator';
import { LogClientErrorDto } from './dto/log-client-error.dto';

@ApiTags('client-log')
@Controller()
export class LogErrorController {
  constructor(
    @InjectPinoLogger(LogErrorController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post('log-error')
  @Public()
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Regista erros do Next.js (global-error) via Pino' })
  @ApiResponse({ status: 204 })
  logError(@Body() body: LogClientErrorDto): void {
    this.logger.warn(
      {
        clientError: true,
        message: body.message,
        stack: body.stack,
        context: body.context,
        url: body.url,
        userAgent: body.userAgent,
      },
      'client error',
    );
  }
}
