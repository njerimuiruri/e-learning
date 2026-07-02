import { NextResponse } from 'next/server';

const DSS_BASE = process.env.DSS_BASE_URL || 'http://64.225.98.64';

export async function GET() {
  const email = process.env.DSS_EMAIL;
  const password = process.env.DSS_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'DSS credentials not configured. Set DSS_EMAIL and DSS_PASSWORD in .env.local' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${DSS_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      return NextResponse.json(
        { error: err.detail || 'DSS login failed' },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { token: data.access_token },
      {
        headers: {
          // Cache for 50 minutes (DSS JWTs typically last 60 min)
          'Cache-Control': 's-maxage=3000, stale-while-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Could not reach DSS server' }, { status: 503 });
  }
}
