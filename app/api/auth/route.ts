import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

function backendUrl() {
  return (
    process.env.INTERNAL_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3001'
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: 'E-mail e senha obrigatórios' },
      { status: 400 },
    );
  }

  const res = await fetch(`${backendUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
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
    return NextResponse.json({ message }, { status: res.status });
  }

  const data = (await res.json()) as {
    access_token?: string;
    user?: unknown;
  };
  const token = data.access_token;
  if (!token) {
    return NextResponse.json(
      { message: 'Resposta inválida da API' },
      { status: 502 },
    );
  }

  const out = NextResponse.json({ ok: true, user: data.user });
  out.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return out;
}

export async function DELETE() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return out;
}
