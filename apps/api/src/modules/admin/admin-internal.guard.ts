import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminInternalGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_INTERNAL_KEY')?.trim();
    if (!expected) {
      throw new ForbiddenException('ADMIN_INTERNAL_KEY não configurada');
    }
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, unknown>;
      user?: { id: string };
    }>();
    const key = req.headers['x-admin-key'];
    if (typeof key !== 'string' || key !== expected) {
      throw new ForbiddenException('Chave de admin inválida');
    }
    req.user = { id: `admin:${key.slice(0, 8)}` };
    return true;
  }
}
