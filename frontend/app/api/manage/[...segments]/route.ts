import { NextRequest } from 'next/server';
import { forwardProtectedApi } from '../../../../lib/auth-proxy';

const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/, /^venues$/, /^accessibility\/options$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/overview$'),
    new RegExp('^sessions/' + UUID + '/staff$'),
  ],
  POST: [
    /^events$/, /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
    new RegExp('^sessions/' + UUID + '/staff$'),
  ],
  DELETE: [new RegExp('^sessions/' + UUID + '/staff/' + UUID + '$')],
  PATCH: [new RegExp('^events/' + UUID + '$'),
    new RegExp('^sessions/' + UUID + '/schedule$')],
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
  const permitted = (paths[request.method] ?? []).some(re => re.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
),
    new RegExp('^events/' + UUID + '/pause
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
    new RegExp('^sessions/' + UUID + '/staff$'),
  ],
  DELETE: [new RegExp('^sessions/' + UUID + '/staff/' + UUID + '$')],
  PATCH: [new RegExp('^events/' + UUID + '$'),
    new RegExp('^sessions/' + UUID + '/schedule$')],
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
  const permitted = (paths[request.method] ?? []).some(re => re.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
),
    new RegExp('^events/' + UUID + '/resume
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
    new RegExp('^sessions/' + UUID + '/staff$'),
  ],
  DELETE: [new RegExp('^sessions/' + UUID + '/staff/' + UUID + '$')],
  PATCH: [new RegExp('^events/' + UUID + '$'),
    new RegExp('^sessions/' + UUID + '/schedule$')],
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
  const permitted = (paths[request.method] ?? []).some(re => re.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
    new RegExp('^sessions/' + UUID + '/staff$'),
  ],
  DELETE: [new RegExp('^sessions/' + UUID + '/staff/' + UUID + '$')],
  PATCH: [new RegExp('^events/' + UUID + '$'),
    new RegExp('^sessions/' + UUID + '/schedule$')],
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
  const permitted = (paths[request.method] ?? []).some(re => re.test(path));
  return forwardProtectedApi(request, 'manage/' + path, permitted);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
