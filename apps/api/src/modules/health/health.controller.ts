import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { HealthCheckService } from './health-check.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheck: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Health agregado (DB + Redis)' })
  @ApiResponse({ status: 200, description: 'Corpo com status ok | degraded | down' })
  async check() {
    return this.healthCheck.check();
  }
}
