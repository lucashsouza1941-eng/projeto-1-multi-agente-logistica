import * as crypto from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private sha256(s: string): string {
    return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
  }

  private refreshPepper(): string {
    return this.config?.get<string>('REFRESH_TOKEN_SECRET')?.trim() ?? '';
  }

  async register(email: string, password: string, name: string) {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new ConflictException('Usuário já cadastrado');
    }
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    const normalized = email.trim().toLowerCase();
    await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        name,
        role: count === 0 ? 'ADMIN' : 'USER',
      },
    });
    return { message: 'Cadastro concluído', email: normalized, name };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const refreshRaw = `${user.id}.${crypto.randomBytes(32).toString('base64url')}`;
    const refreshToken = await bcrypt.hash(
      refreshRaw + this.refreshPepper(),
      this.saltRounds,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role === 'ADMIN' ? 'admin' : 'user',
      }),
      refresh_token: refreshRaw,
      user: { email: user.email, name: user.name },
    };
  }

  async refresh(refreshToken: string) {
    const [uid, secret] = refreshToken.split('.', 2);
    if (!uid || !secret) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const user = await this.prisma.user.findUnique({ where: { id: uid } });
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Sessão inválida');
    }
    const ok = await bcrypt.compare(
      refreshToken + this.refreshPepper(),
      user.refreshToken,
    );
    if (!ok) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const newRefreshRaw = `${user.id}.${crypto.randomBytes(32).toString('base64url')}`;
    const newHash = await bcrypt.hash(
      newRefreshRaw + this.refreshPepper(),
      this.saltRounds,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHash },
    });

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role === 'ADMIN' ? 'admin' : 'user',
      }),
      refresh_token: newRefreshRaw,
    };
  }

  /** `authenticatedUserId` vem só do JWT/API key (`req.user.id`), nunca do body. */
  async createApiKey(authenticatedUserId: string, name: string) {
    const raw = `logi_${crypto.randomBytes(24).toString('base64url')}`;
    const lookupHash = this.sha256(raw);
    const keyHash = await bcrypt.hash(raw, this.saltRounds);
    const keyPrefix = raw.slice(0, 14);
    const row = await this.prisma.apiKey.create({
      data: {
        userId: authenticatedUserId,
        name,
        keyHash,
        keyPrefix,
        lookupHash,
      },
    });
    return { id: row.id, apiKey: raw, name: row.name };
  }

  async listApiKeys(authenticatedUserId: string) {
    const rows = await this.prisma.apiKey.findMany({
      where: { userId: authenticatedUserId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      maskedValue: `${r.keyPrefix}…`,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async revokeApiKey(authenticatedUserId: string, keyId: string) {
    const row = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!row || row.userId !== authenticatedUserId) {
      throw new ForbiddenException('Chave não encontrada');
    }
    if (row.revokedAt) {
      return { id: keyId, revoked: true };
    }
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    return { id: keyId, revoked: true };
  }

  async validateApiKeyRaw(rawKey: string): Promise<{ userId: string } | null> {
    if (!rawKey.startsWith('logi_')) {
      return null;
    }
    const lookupHash = this.sha256(rawKey);
    const row = await this.prisma.apiKey.findUnique({
      where: { lookupHash },
    });
    if (!row || row.revokedAt != null) {
      return null;
    }
    const ok = await bcrypt.compare(rawKey, row.keyHash);
    if (!ok) {
      return null;
    }
    return { userId: row.userId };
  }
}
