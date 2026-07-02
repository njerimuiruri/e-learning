import { NextRequest, NextResponse } from 'next/server';

const DSS_BASE = process.env.DSS_BASE_URL || 'http://64.225.98.64';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${DSS_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.DSS_EMAIL,
      password: process.env.DSS_PASSWORD,
    }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('DSS login failed');
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken!;
}

export async function POST(req: NextRequest) {
  const { path, body } = await req.json();

  if (!path?.startsWith('/api/v1/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const token = await getToken();

    const dssRes = await fetch(`${DSS_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await dssRes.json().catch(() => ({ detail: dssRes.statusText }));

    if (!dssRes.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((e: { msg: string }) => e.msg).join('; ')
        : data.detail || 'DSS request failed';
      return NextResponse.json({ error: detail }, { status: dssRes.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
