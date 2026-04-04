import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Utilizador autenticado (JWT `sub` ou API key) — sempre usar `id`, nunca IDs do corpo. */
export type AuthUserPayload = { id: string; email?: string; role?: 'user' | 'admin' };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUserPayload }>();
    return req.user;
  },
);
