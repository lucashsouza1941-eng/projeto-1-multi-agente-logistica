import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { UpdateAgentConfigDto } from './dto/update-agent-config.dto';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar agentes' })
  @ApiResponse({ status: 200, description: 'Lista' })
  list() {
    return this.agentsService.list();
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Logs do agente' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Logs' })
  getLogs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.agentsService.getLogs(id, Number(limit) || 100);
  }

  @Patch(':id/config')
  @ApiOperation({ summary: 'Atualizar config do agente' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateAgentConfigDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  updateConfig(@Param('id') id: string, @Body() body: UpdateAgentConfigDto) {
    return this.agentsService.updateConfig(id, body.config);
  }

  @Post(':id/restart')
  @ApiOperation({ summary: 'Reiniciar agente' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Aceito' })
  restart(@Param('id') id: string) {
    return this.agentsService.restart(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do agente' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Agente' })
  getById(@Param('id') id: string) {
    return this.agentsService.getById(id);
  }
}
