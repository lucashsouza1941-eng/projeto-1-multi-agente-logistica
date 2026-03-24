import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':category')
  @ApiOperation({ summary: 'Configurações por categoria' })
  @ApiParam({ name: 'category' })
  @ApiResponse({ status: 200, description: 'Mapa chave → valor' })
  getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Atualizar configuração por chave' })
  @ApiParam({ name: 'key' })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  update(@Param('key') key: string, @Body() body: UpdateSettingDto) {
    return this.settingsService.update(key, body.value);
  }
}
