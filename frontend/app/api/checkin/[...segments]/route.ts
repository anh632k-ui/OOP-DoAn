import { NextRequest } from 'next/server';
import { forwardProtectedApi } from '../../../../lib/auth-proxy';

async function handle(request: NextRequest, { params }: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  const path = segments.join('/');
  const allowed = (request.method === 'POST' && path === 'scan')
    || (request.method === 'GET'
      && new RegExp('^sessions/[0-9a-fA-F-]{36}/stats$').test(path));
  return forwardProtectedApi(request, `checkin/${path}`, allowed);
}

export const GET = handle;
export const POST = handle;
