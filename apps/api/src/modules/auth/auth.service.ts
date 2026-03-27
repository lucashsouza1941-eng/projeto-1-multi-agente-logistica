import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_PRIMARY_USER_SETTING_KEY } from './auth.constants';

interface StoredPrimaryUser {
  email: string;
  passwordHash: string;
  name: string;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.setting.findUnique({
      where: { key: AUTH_PRIMARY_USER_SETTING_KEY },
    });
    if (existing) {
      throw new ConflictException('Usuário já cadastrado');
    }
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    const value: StoredPrimaryUser = { email, passwordHash, name };
    await this.prisma.setting.create({
      data: {
        key: AUTH_PRIMARY_USER_SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
        category: 'auth',
      },
    });
    return { message: 'Cadastro concluído', email, name };
  }

  async login(email: string, password: string) {
    const row = await this.prisma.setting.findUnique({
      where: { key: AUTH_PRIMARY_USER_SETTING_KEY },
    });
    if (!row) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const stored = row.value as unknown as StoredPrimaryUser;
    if (!stored?.email || !stored?.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const emailMatch =
      stored.email.trim().toLowerCase() === email.trim().toLowerCase();
    if (!emailMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const ok = await bcrypt.compare(password, stored.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { sub: stored.email, email: stored.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { email: stored.email, name: stored.name },
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
