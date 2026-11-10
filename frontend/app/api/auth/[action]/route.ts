import { NextRequest, NextResponse } from 'next/server';

type AuthResponse = {
  accessToken?: string;
  user?: { id: string; email: string; name: string; roles: string[] };
};

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (!['login', 'register', 'logout'].includes(action)) {
    return NextResponse.json({ message: 'Không tìm thấy chức năng' }, { status: 404 });
  }

  // Next.js can internally normalize nextUrl to 127.0.0.1 while the
  // browser uses localhost. Compare Origin with the actual Host header.
  // Keep rejecting cross-origin POSTs (CSRF protection).
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin) {
    let sameOrigin = false;
    try {
      const parsed = new URL(origin);
      sameOrigin = (parsed.protocol === 'http:' || parsed.protocol === 'https:')
        && host !== null
        && parsed.host === host.toLowerCase()
        && parsed.pathname === '/'
        && !parsed.search
        && !parsed.hash;
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      return NextResponse.json({ message: 'Nguồn yêu cầu không hợp lệ' }, { status: 403 });
    }
  }

  if (action === 'logout') {
    // request.url may use Docker's 0.0.0.0 bind address, which is not a
    // browser destination. The Host header is the browser-facing authority.
    const publicHost = request.headers.get('host');
    if (!publicHost || !/^(localhost|127\.0\.0\.1|\[[0-9a-fA-F:]+\]|[a-zA-Z0-9.-]+)(:\d{1,5})?$/.test(publicHost)
      || publicHost.startsWith('0.0.0.0')) {
      return NextResponse.json({ message: 'Địa chỉ truy cập không hợp lệ' }, { status: 400 });
    }
    const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const response = NextResponse.redirect(new URL('/', `${protocol}://${publicHost}`), { status: 303 });
    response.cookies.delete('med06_session');
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'JSON không hợp lệ' }, { status: 400 });
  }

  try {
    const backend = await fetch(`${api}/api/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });

    const payload = (await backend.json()) as AuthResponse & {
      message?: string | string[];
    };
    if (!backend.ok) {
      return NextResponse.json(
        { message: payload.message ?? 'Không thể thực hiện yêu cầu' },
        { status: backend.status },
      );
    }
    if (typeof payload.accessToken !== 'string' || !payload.user) {
      return NextResponse.json({ message: 'Phản hồi xác thực không hợp lệ' }, { status: 502 });
    }
    const response = NextResponse.json({ user: payload.user }, { status: backend.status });
    response.cookies.set('med06_session', payload.accessToken, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'Không thể kết nối máy chủ xác thực' }, { status: 502 });
  }
}
