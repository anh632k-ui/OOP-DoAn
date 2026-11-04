import { NextRequest } from 'next/server';
import { forwardProtectedApi } from '../../../../lib/auth-proxy';

const UUID = '[0-9a-fA-F-]{36}';
const patterns: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^sessions/' + UUID + '/draw
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
  ],
  PATCH: [new RegExp('^events/' + UUID + '$')],
  PUT: [
    new RegExp('^sessions/' + UUID + '/policy$'),
    new RegExp('^events/' + UUID + '/accessibility$'),
  ],
};

async function handle(request: NextRequest, {
  params,
}: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const path = segments.join('/');
  const permitted = (patterns[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
),
    new RegExp('^sessions/' + UUID + '/overview
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
  ],
  PATCH: [new RegExp('^events/' + UUID + '$')],
  PUT: [
    new RegExp('^sessions/' + UUID + '/policy$'),
    new RegExp('^events/' + UUID + '/accessibility$'),
  ],
};

async function handle(request: NextRequest, {
  params,
}: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const path = segments.join('/');
  const permitted = (patterns[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
),
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
  ],
  PATCH: [new RegExp('^events/' + UUID + '$')],
  PUT: [
    new RegExp('^sessions/' + UUID + '/policy$'),
    new RegExp('^events/' + UUID + '/accessibility$'),
  ],
};

async function handle(request: NextRequest, {
  params,
}: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const path = segments.join('/');
  const permitted = (patterns[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
