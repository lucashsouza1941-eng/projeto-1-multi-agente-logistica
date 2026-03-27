import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject(DashboardService) private readonly dashboard: DashboardService,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs do dashboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'custom'] })
  @ApiResponse({ status: 200, description: 'KPIs agregados' })
  getKpis(@Query('period') period?: string) {
    return this.dashboard.getKpis(period || '7d');
  }

  @Get('activity')
  @ApiOperation({ summary: 'Feed de atividade (logs de agentes)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  getActivity(@Query('limit') limit?: string) {
    return this.dashboard.getActivity(Number(limit) || 50);
  }

  @Get('charts/volume')
  @ApiOperation({ summary: 'Volume de e-mails por hora (24h)' })
  @ApiQuery({ name: 'granularity', required: false })
  @ApiResponse({ status: 200, description: 'Série temporal' })
  getVolumeChart(@Query('granularity') granularity?: string) {
    return this.dashboard.getVolumeChart(granularity || 'hour');
  }

  @Get('charts/categories')
  @ApiOperation({ summary: 'Distribuição por categoria de triagem' })
  @ApiResponse({ status: 200, description: 'Contagens por categoria' })
  getCategories() {
    return this.dashboard.getCategoryDistribution();
  }
}
