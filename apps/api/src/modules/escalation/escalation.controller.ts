import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EscalationService } from './escalation.service';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';

@ApiTags('escalation')
@Controller('escalation')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Listar tickets' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Lista' })
  listTickets(@Query('status') status?: string) {
    return this.escalationService.listTickets(status);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Obter ticket' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket' })
  getTicket(@Param('id') id: string) {
    return this.escalationService.getTicket(id);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Atualizar status do ticket' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTicketStatusDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  updateStatus(@Param('id') id: string, @Body() body: UpdateTicketStatusDto) {
    return this.escalationService.updateStatus(id, body.status);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Regras de escalação' })
  @ApiResponse({ status: 200, description: 'Regras' })
  getRules() {
    return this.escalationService.getRules();
  }

  @Put('rules')
  @ApiOperation({ summary: 'Atualizar regras' })
  @ApiBody({ type: UpdateRulesDto })
  @ApiResponse({ status: 200, description: 'Salvo' })
  updateRules(@Body() body: UpdateRulesDto) {
    return this.escalationService.updateRules(body.rules);
  }
}
