import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, logout } from './auth';

describe('login / logout', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      } as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('login posts to /api/auth with credentials include', async () => {
    const r = await login('a@b.com', 'secret123');
    expect(r).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.com', password: 'secret123' }),
      }),
    );
  });

  it('logout deletes session via /api/auth', async () => {
    await logout();
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });
});
