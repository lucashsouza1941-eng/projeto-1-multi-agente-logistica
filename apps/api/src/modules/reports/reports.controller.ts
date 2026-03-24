import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar relatórios' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Lista' })
  list(@Query('status') status?: string) {
    return this.reportsService.list(status);
  }

  @Post()
  @ApiOperation({ summary: 'Criar relatório' })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({ status: 201, description: 'Criado' })
  create(@Body() body: CreateReportDto) {
    return this.reportsService.create(body);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerar relatório' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Enfileirado' })
  regenerate(@Param('id') id: string) {
    return this.reportsService.regenerate(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do relatório' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Detalhe' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@Param('id') id: string) {
    return this.reportsService.getById(id);
  }
}
