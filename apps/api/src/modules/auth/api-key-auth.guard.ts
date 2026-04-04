import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Autenticação por API key (`x-api-key` ou `Authorization: Bearer logi_...`).
 * Rejeita chaves revogadas ou inválidas (via {@link AuthService.validateApiKeyRaw}).
 * Use com `@Public()` quando a rota não deva passar pelo JWT global.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: { id: string; email?: string };
    }>();
    const x = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    let raw: string | undefined;
    if (typeof x === 'string' && x.trim()) {
      raw = x.trim();
    } else if (typeof authHeader === 'string') {
      const m = authHeader.match(/^Bearer\s+(.+)$/i);
      if (m?.[1]) raw = m[1].trim();
    }
    if (!raw) {
      throw new UnauthorizedException('API key ausente');
    }
    const user = await this.auth.validateApiKeyRaw(raw);
    if (!user) {
      throw new UnauthorizedException('API key inválida ou revogada');
    }
    req.user = { id: user.userId };
    return true;
  }
}
