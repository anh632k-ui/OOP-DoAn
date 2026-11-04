import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

function allowOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && parsed.host.toLowerCase() === request.headers.get('host')?.toLowerCase()
      && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch { return false; }
}

export async function forwardProtectedApi(
  request: NextRequest, backendPath: string, allowed: boolean,
): Promise<NextResponse> {
  if (!allowed) {
    return NextResponse.json({ message: 'Chức năng không hợp lệ' }, { status: 404 });
  }
  if (request.method !== 'GET' && !allowOrigin(request)) {
    return NextResponse.json({ message: 'Nguồn yêu cầu không hợp lệ' }, { status: 403 });
  }
  const token = (await cookies()).get('med06_session')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 });
  }
  let body: string | undefined;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (request.method !== 'GET') {
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
      return NextResponse.json({ message: 'Chỉ nhận JSON' }, { status: 415 });
    }
    body = await request.text();
    if (body.length > 16384) {
      return NextResponse.json({ message: 'Dữ liệu quá lớn' }, { status: 413 });
    }
    headers['Content-Type'] = 'application/json';
  }
  try {
    const query = request.method === 'GET' ? request.nextUrl.search : '';
    if (query.length > 256) {
      return NextResponse.json({ message: 'Bộ lọc quá dài' }, { status: 400 });
    }
    const response = await fetch(`${api}/api/${backendPath}${query}`, {
      method: request.method,
      headers, body, cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    // Never reflect a token or upstream cookie.
    const payload = await response.json();
    return NextResponse.json(payload, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ message: 'Máy chủ chưa sẵn sàng' }, { status: 502 });
  }
}
