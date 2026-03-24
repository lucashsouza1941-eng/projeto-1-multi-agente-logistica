import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login (JWT)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Token emitido' })
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
