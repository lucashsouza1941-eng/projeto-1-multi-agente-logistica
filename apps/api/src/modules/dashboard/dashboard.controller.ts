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
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD (com period=custom)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD (com period=custom)' })
  @ApiResponse({ status: 200, description: 'KPIs agregados' })
  getKpis(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboard.getKpis(period || '7d', startDate, endDate);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Feed de atividade (logs de agentes)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  getActivity(@Query('limit') limit?: string) {
    return this.dashboard.getActivity(Number(limit) || 50);
  }

  @Get('charts/volume')
  @ApiOperation({ summary: 'Volume de e-mails por hora (24h) ou intervalo customizado' })
  @ApiQuery({ name: 'granularity', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Série temporal' })
  getVolumeChart(
    @Query('granularity') granularity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboard.getVolumeChart(
      granularity || 'hour',
      startDate,
      endDate,
    );
  }

  @Get('charts/categories')
  @ApiOperation({ summary: 'Distribuição por categoria de triagem' })
  @ApiResponse({ status: 200, description: 'Contagens por categoria' })
  getCategories() {
    return this.dashboard.getCategoryDistribution();
  }
}
