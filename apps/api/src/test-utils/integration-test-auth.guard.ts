import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

/** Injeta `req.user` para testes HTTP sem JWT real. */
@Injectable()
export class IntegrationTestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    req.user = { id: 'integration-user' };
    return true;
  }
}
