import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, type AuthUserPayload } from '../auth/current-user.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ThrottlerUserGuard } from '../../common/guards/throttler-user.guard';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar relatórios' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Lista' })
  list(
    @CurrentUser() user: AuthUserPayload,
    @Query('status') status?: string,
  ) {
    return this.reportsService.list(user.id, status);
  }

  @Post()
  @UseGuards(ThrottlerUserGuard)
  @Throttle({ jobs: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Criar relatório' })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({ status: 201, description: 'Criado' })
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateReportDto,
  ) {
    return this.reportsService.create(user.id, body);
  }

  @Post(':id/regenerate')
  @UseGuards(ThrottlerUserGuard)
  @Throttle({ llm: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Regenerar relatório' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Enfileirado' })
  regenerate(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    return this.reportsService.regenerate(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do relatório' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Detalhe' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.reportsService.getById(user.id, id);
  }
}
