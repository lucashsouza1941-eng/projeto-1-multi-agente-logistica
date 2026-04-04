import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
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
import { EmailService } from './email.service';
import { ReclassifyEmailDto } from './dto/reclassify-email.dto';
import { BulkEmailActionDto } from './dto/bulk-email-action.dto';
import { ThrottlerUserGuard } from '../../common/guards/throttler-user.guard';

@ApiTags('emails')
@Controller('emails')
export class EmailController {
  constructor(@Inject(EmailService) private readonly emailService: EmailService) {}

  @Get()
  @ApiOperation({ summary: 'Listar e-mails' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  list(
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    return this.emailService.list(
      user.id,
      Number(page) || 1,
      Number(limit) || 20,
      category,
      sort || 'createdAt:desc',
    );
  }

  @Post('bulk-action')
  @UseGuards(ThrottlerUserGuard)
  @Throttle({ jobs: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ação em lote' })
  @ApiBody({ type: BulkEmailActionDto })
  @ApiResponse({ status: 201, description: 'Processado' })
  bulkAction(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: BulkEmailActionDto,
  ) {
    return this.emailService.bulkAction(user.id, body.ids, body.action);
  }

  @Post(':id/process')
  @UseGuards(ThrottlerUserGuard)
  @Throttle({ llm: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Enfileirar processamento de triagem (demo)',
    description:
      'Adiciona um job BullMQ `process-email` na fila email-triage para o e-mail indicado.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Job enfileirado' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  enqueueProcess(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    return this.emailService.enqueueProcess(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter e-mail por id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Detalhe' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.emailService.getById(user.id, id);
  }

  @Patch(':id/reclassify')
  @ApiOperation({ summary: 'Reclassificar e-mail' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: ReclassifyEmailDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  reclassify(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: ReclassifyEmailDto,
  ) {
    return this.emailService.reclassify(user.id, id, body);
  }
}
