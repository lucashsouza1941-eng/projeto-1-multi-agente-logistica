import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

function backendUrl() {
  return (
    process.env.INTERNAL_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3001'
  );
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const subpath = pathSegments.join('/');
  const target = `${backendUrl()}/${subpath}${req.nextUrl.search}`;
  const method = req.method;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
    const ct = req.headers.get('content-type');
    if (ct) headers['Content-Type'] = ct;
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(target, init);
  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ctOut = res.headers.get('Content-Type');
  if (ctOut) out.headers.set('Content-Type', ctOut);
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
