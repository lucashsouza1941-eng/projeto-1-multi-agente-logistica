import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, _password: string) {
    const payload = { sub: email, email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { email, name: 'João Silva' },
    };
  }

  async createApiKey(userId: string, name: string) {
    const token = this.jwtService.sign(
      { sub: userId, type: 'api_key', name },
      { expiresIn: '365d' },
    );
    return { apiKey: `logi_${token.slice(0, 32)}...`, name };
  }
}
