import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const ID = /^[0-9a-fA-F-]{36}$/;

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol)
      && url.host.toLowerCase() === req.headers.get('host')?.toLowerCase()
      && url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}

export async function GET(
  req: NextRequest, { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ message: 'ID không hợp lệ' }, { status: 400 });
  const preview = req.nextUrl.searchParams.get('preview') === '1';
  let authHeaders: Record<string, string> = {};
  if (preview) {
    const token = (await cookies()).get('med06_session')?.value;
    if (!token) return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 });
    authHeaders = { Authorization: `Bearer ${token}` };
  }
  try {
    const path = preview ? `manage/events/${id}/cover` : `events/${id}/cover`;
    const response = await fetch(`${api}/api/${path}`, {
      headers: authHeaders, cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return new NextResponse(null, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 2 * 1024 * 1024) {
      return new NextResponse(null, { status: 502 });
    }
    const type = response.headers.get('content-type') ?? 'image/jpeg';
    return new NextResponse(new Blob([bytes], { type }), {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch { return new NextResponse(null, { status: 502 }); }
}

export async function POST(
  req: NextRequest, { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ message: 'ID không hợp lệ' }, { status: 400 });
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: 'Nguồn yêu cầu không hợp lệ' }, { status: 403 });
  }
  const token = (await cookies()).get('med06_session')?.value;
  if (!token) return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 });
  try {
    const input = await req.formData();
    const image = input.get('image');
    if (!(image instanceof File) || image.size === 0 || image.size > 2 * 1024 * 1024
      || !['image/png', 'image/jpeg', 'image/webp'].includes(image.type)) {
      return NextResponse.json({ message: 'Chỉ nhận ảnh PNG/JPEG/WebP tối đa 2MB' }, { status: 400 });
    }
    const body = new FormData();
    body.append('image', image);
    const response = await fetch(`${api}/api/manage/events/${id}/cover`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
      body, cache: 'no-store', signal: AbortSignal.timeout(20000),
    });
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ message: 'Object storage không sẵn sàng' }, { status: 502 });
  }
}
