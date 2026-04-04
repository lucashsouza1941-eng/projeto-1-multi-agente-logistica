import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/lib/auth';

function backendUrl() {
  return (
    process.env.INTERNAL_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3001'
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    refreshToken?: string;
  } | null;
  const refreshToken =
    body?.refreshToken ?? req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { message: 'Refresh token em falta' },
      { status: 400 },
    );
  }

  const res = await fetch(`${backendUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = 'Falha ao renovar sessão';
    try {
      const j = JSON.parse(text) as { message?: string | string[] };
      if (Array.isArray(j.message)) message = j.message.join(', ');
      else if (typeof j.message === 'string') message = j.message;
    } catch {
      if (text) message = text;
    }
    return NextResponse.json({ message }, { status: res.status });
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!data.access_token) {
    return NextResponse.json(
      { message: 'Resposta inválida da API' },
      { status: 502 },
    );
  }

  const out = NextResponse.json({ ok: true });
  out.cookies.set(AUTH_COOKIE_NAME, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });
  if (data.refresh_token) {
    out.cookies.set(REFRESH_COOKIE_NAME, data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return out;
}
