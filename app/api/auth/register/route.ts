import { NextRequest, NextResponse } from 'next/server';

function backendUrl() {
  return (
    process.env.INTERNAL_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3001'
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Corpo da requisição inválido' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      {
        message:
          'Serviço indisponível. Confirme que a API Nest está rodando e, em Docker, defina INTERNAL_API_URL.',
      },
      { status: 502 },
    );
  }

  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('Content-Type');
  if (ct) out.headers.set('Content-Type', ct);
  return out;
}
