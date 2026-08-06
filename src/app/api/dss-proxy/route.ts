import { NextRequest, NextResponse } from 'next/server';

const DSS_BASE = process.env.DSS_BASE_URL || 'http://64.225.98.64';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

// "AI for Climate Resilience" category  the only category allowed to use this tool.
const CLIMATE_RESILIENCE_CATEGORY_ID = '69ce216b97ba6be0d2f30b66';

interface AuthResult {
  ok: boolean;
  status: number;
  message: string;
}

async function authorizeRequest(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { ok: false, status: 401, message: 'Login required' };
  }

  const meRes = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: authHeader },
    cache: 'no-store',
  });
  if (!meRes.ok) {
    return { ok: false, status: 401, message: 'Login required' };
  }

  const { user } = await meRes.json().catch(() => ({ user: null }));
  if (!user) {
    return { ok: false, status: 401, message: 'Login required' };
  }

  if (user.role === 'admin') return { ok: true, status: 200, message: '' };

  const assignedCategories = (user.fellowData?.assignedCategories || []).map((id: unknown) => String(id));
  const purchasedCategories = (user.purchasedCategories || []).map((id: unknown) => String(id));
  const hasAccess = assignedCategories.includes(CLIMATE_RESILIENCE_CATEGORY_ID)
    || purchasedCategories.includes(CLIMATE_RESILIENCE_CATEGORY_ID);

  if (!hasAccess) {
    return { ok: false, status: 403, message: 'This tool is only available to AI for Climate Resilience fellows.' };
  }

  return { ok: true, status: 200, message: '' };
}

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
  const auth = await authorizeRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

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
