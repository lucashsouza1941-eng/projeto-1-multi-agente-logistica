import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { ReclassifyEmailDto } from './dto/reclassify-email.dto';
import { BulkEmailActionDto } from './dto/bulk-email-action.dto';

@ApiTags('emails')
@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  @ApiOperation({ summary: 'Listar e-mails' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada' })
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    return this.emailService.list(Number(page) || 1, Number(limit) || 20, category, sort || 'createdAt:desc');
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Ação em lote' })
  @ApiBody({ type: BulkEmailActionDto })
  @ApiResponse({ status: 201, description: 'Processado' })
  bulkAction(@Body() body: BulkEmailActionDto) {
    return this.emailService.bulkAction(body.ids, body.action);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter e-mail por id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Detalhe' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@Param('id') id: string) {
    return this.emailService.getById(id);
  }

  @Patch(':id/reclassify')
  @ApiOperation({ summary: 'Reclassificar e-mail' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: ReclassifyEmailDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  reclassify(@Param('id') id: string, @Body() body: ReclassifyEmailDto) {
    return this.emailService.reclassify(id, body);
  }
}
