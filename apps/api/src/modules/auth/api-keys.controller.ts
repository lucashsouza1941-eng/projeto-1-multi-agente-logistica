import { Controller, Delete, Inject, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, type AuthUserPayload } from './current-user.decorator';

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Revogar API key (soft delete)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Revogada' })
  @ApiResponse({ status: 403, description: 'Não pertence ao utilizador' })
  revoke(@Param('id') id: string, @CurrentUser() user: AuthUserPayload) {
    return this.authService.revokeApiKey(user.id, id);
  }
}
