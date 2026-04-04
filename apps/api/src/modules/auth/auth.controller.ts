import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './public.decorator';
import { CurrentUser, type AuthUserPayload } from './current-user.decorator';
import { ThrottlerUserGuard } from '../../common/guards/throttler-user.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Get('verify-api-key')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Valida API key (x-api-key ou Bearer logi_...)' })
  @ApiResponse({ status: 200, description: 'Chave aceite' })
  @ApiResponse({ status: 401, description: 'Chave ausente, inválida ou revogada' })
  verifyApiKey() {
    return { valid: true };
  }

  @Public()
  @Post('register')
  @UseGuards(ThrottlerUserGuard)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cadastro do usuário principal (uma vez)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  @ApiResponse({ status: 409, description: 'Já existe usuário cadastrado' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Public()
  @Post('login')
  @UseGuards(ThrottlerUserGuard)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login (JWT + refresh)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Tokens emitidos' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token (rotação de refresh)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 201, description: 'Novos tokens' })
  @ApiResponse({ status: 401, description: 'Refresh inválido' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Criar API key (associada ao JWT atual)' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({ status: 201, description: 'Chave criada (valor completo só agora)' })
  async createApiKey(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateApiKeyDto,
  ) {
    return this.authService.createApiKey(user.id, body.name);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'Listar API keys ativas do utilizador' })
  @ApiResponse({ status: 200, description: 'Lista mascarada' })
  listApiKeys(@CurrentUser() user: AuthUserPayload) {
    return this.authService.listApiKeys(user.id);
  }
}
