/** Cookie name shared with `app/api/auth/route.ts` and `app/api/backend/[...path]/route.ts`. */
export const AUTH_COOKIE_NAME = 'logiagent_token';

/** Refresh token opaco (rotação no backend). */
export const REFRESH_COOKIE_NAME = 'logiagent_refresh';

/**
 * Login via Next route handler (sets httpOnly cookie). Use from Client Components.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = 'Falha no login';
    try {
      const j = JSON.parse(text) as { message?: string | string[] };
      if (Array.isArray(j.message)) message = j.message.join(', ');
      else if (typeof j.message === 'string') message = j.message;
    } catch {
      if (text) message = text;
    }
    return { ok: false, message };
  }
  return { ok: true };
}

/** Clears session cookie. Use from Client Components. */
export async function logout(): Promise<void> {
  await fetch('/api/auth', { method: 'DELETE', credentials: 'include' });
}

/**
 * Returns JWT from httpOnly cookie (Server Components / Route Handlers only).
 * In the browser always returns `null` — use `/api/backend` proxy with `credentials: 'include'`.
 */
export async function getToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return null;
  }
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}
