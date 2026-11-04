import { NextRequest } from 'next/server';
import { forwardProtectedApi } from '../../../../lib/auth-proxy';

const UUID = '[0-9a-fA-F-]{36}';

async function handle(request: NextRequest, {
  params,
}: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const path = segments.join('/');
  const allowed = request.method === 'GET' && (path === 'users' || path === 'audit')
    || request.method === 'PUT'
      && new RegExp('^users/' + UUID + '/roles$').test(path);
  return forwardProtectedApi(request, 'admin/' + path, allowed);
}

export const GET = handle;
export const PUT = handle;
