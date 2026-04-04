import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthUserPayload } from '../auth/current-user.decorator';
import { EscalationService } from './escalation.service';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';

@ApiTags('escalation')
@Controller('escalation')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ticket de escalação' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Criado' })
  createTicket(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateTicketDto,
  ) {
    return this.escalationService.createTicket(user.id, body);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Listar tickets' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Lista' })
  listTickets(
    @CurrentUser() user: AuthUserPayload,
    @Query('status') status?: string,
  ) {
    return this.escalationService.listTickets(user.id, status);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Obter ticket' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket' })
  getTicket(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.escalationService.getTicket(user.id, id);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Atualizar status do ticket' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTicketStatusDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  updateStatus(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    return this.escalationService.updateStatus(user.id, id, body.status);
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
