import { ForbiddenException } from '@nestjs/common';

/** Garante `resource.userId === utilizador JWT` (mitiga IDOR). */
export function assertResourceOwned(
  resourceUserId: string | null | undefined,
  requestUserId: string,
): void {
  if (resourceUserId == null || resourceUserId !== requestUserId) {
    throw new ForbiddenException(
      'Recurso não pertence ao utilizador autenticado',
    );
  }
}
