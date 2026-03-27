import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro do usuário principal (uma vez)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  @ApiResponse({ status: 409, description: 'Já existe usuário cadastrado' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login (JWT)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Token emitido' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('api-key')
  @ApiOperation({ summary: 'Criar API key (JWT long-lived)' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({ status: 201, description: 'API key criada' })
  async createApiKey(@Body() body: CreateApiKeyDto) {
    return this.authService.createApiKey(body.userId, body.name);
  }
}
