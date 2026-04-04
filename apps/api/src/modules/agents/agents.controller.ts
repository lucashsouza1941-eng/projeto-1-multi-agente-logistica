import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentRegistryService } from './agent-registry.service';
import { AgentsService } from './agents.service';
import { CurrentUser, type AuthUserPayload } from '../auth/current-user.decorator';
import { UpdateAgentConfigDto } from './dto/update-agent-config.dto';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(
    @Inject(AgentsService) private readonly agentsService: AgentsService,
    @Inject(AgentRegistryService)
    private readonly agentRegistry: AgentRegistryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar agentes' })
  @ApiResponse({ status: 200, description: 'Lista' })
  list(@CurrentUser() user: AuthUserPayload) {
    return this.agentsService.list(user.id);
  }

  @Get('registry')
  @ApiOperation({ summary: 'Registry em memória (Triage, Report, …)' })
  @ApiResponse({ status: 200, description: 'Metadados registrados' })
  getRegistry() {
    return this.agentRegistry.getAll();
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Logs do agente' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Logs' })
  getLogs(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.getLogs(user.id, id, Number(limit) || 100);
  }

  @Patch(':id/config')
  @ApiOperation({ summary: 'Atualizar config do agente' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateAgentConfigDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  updateConfig(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateAgentConfigDto,
  ) {
    return this.agentsService.updateConfig(user.id, id, body.config);
  }

  @Post(':id/restart')
  @ApiOperation({ summary: 'Reiniciar agente' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Aceito' })
  restart(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.agentsService.restart(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do agente' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Agente' })
  getById(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.agentsService.getById(user.id, id);
  }
}
