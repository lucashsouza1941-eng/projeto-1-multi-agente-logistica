import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) config: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') ||
        'logiagent-dev-jwt-secret-min-32-chars!!',
    });
  }

  async validate(payload: {
    sub: string;
    email?: string;
    role?: 'user' | 'admin';
  }) {
    const row = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!row) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? 'user',
    };
  }
}
