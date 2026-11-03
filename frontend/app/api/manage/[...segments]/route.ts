import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
    new RegExp(`^events/${UUID}/sessionsimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
),
    new RegExp(`^sessions/${UUID}/drawimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
),
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp(`^events/${UUID}/sessions$`),
    new RegExp(`^events/${UUID}/publish$`),
    new RegExp(`^events/${UUID}/cancelimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
    new RegExp(`^events/${UUID}/sessionsimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
),
    new RegExp(`^sessions/${UUID}/drawimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
),
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp(`^events/${UUID}/sessions$`),
    new RegExp(`^events/${UUID}/publish$`),
),
    new RegExp(`^sessions/${UUID}/drawimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
    new RegExp(`^events/${UUID}/sessionsimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
),
    new RegExp(`^sessions/${UUID}/drawimport { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
),
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp(`^events/${UUID}/sessions$`),
    new RegExp(`^events/${UUID}/publish$`),
),
  ],
  PATCH: [new RegExp(`^events/${UUID}$`)],
  PUT: [
    new RegExp(`^sessions/${UUID}/policy$`),
    new RegExp(`^events/${UUID}/accessibility$`),
  ],
};

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    const parsed = new URL(origin);
    return ['http:', 'https:'].includes(parsed.protocol)
      && parsed.host.toLowerCase() === request.headers.get('host')?.toLowerCase()
      && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch { return false; }
}

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const method = request.method;
  const { segments } = await params;
  const path = segments.join('/');
  if (!paths[method]?.some(re => re.test(path))) {
    return NextResponse.json({ message: 'Chức năng không hợp lệ' }, { status: 404 });
  }
  if (method !== 'GET' && !sameOrigin(request)) {
    return NextResponse.json({ message: 'Nguồn yêu cầu không hợp lệ' }, { status: 403 });
  }
  const token = (await cookies()).get('med06_session')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    let body: string | undefined;
    if (method !== 'GET') {
      const type = request.headers.get('content-type')?.split(';')[0].trim();
      if (type !== 'application/json' || Number(request.headers.get('content-length') || 0) > 16384) {
        return NextResponse.json({ message: 'Chỉ chấp nhận JSON tối đa 16KB' }, { status: 415 });
      }
      body = await request.text();
      if (body.length > 16384) {
        return NextResponse.json({ message: 'Dữ liệu quá lớn' }, { status: 413 });
      }
      headers['Content-Type'] = 'application/json';
    }
    const upstream = await fetch(`${api}/api/manage/${path}`, {
      method, headers, body, cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Máy chủ quản lý chưa sẵn sàng' }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
