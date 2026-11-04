import { NextRequest } from 'next/server';
import { forwardProtectedApi } from '../../../../lib/auth-proxy';

const UUID = '[0-9a-fA-F-]{36}';
const paths: Record<string, RegExp[]> = {
  GET: [
    /^events$/,
    /^venues$/,
    /^accessibility\/options$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/overview
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete
  ],
  PATCH: [new RegExp('^events/' + UUID + '
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
)],
  DELETE: [new RegExp('^sessions/' + UUID + '/staff/' + UUID + '
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
)],
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
    new RegExp('^sessions/' + UUID + '/staff
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
),
  ],
  POST: [
    /^events$/,
    /^venues$/,
    new RegExp('^events/' + UUID + '/sessions$'),
    new RegExp('^events/' + UUID + '/publish$'),
    new RegExp('^events/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/draw$'),
    new RegExp('^sessions/' + UUID + '/cancel$'),
    new RegExp('^sessions/' + UUID + '/complete$'),
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
  const allowed = (paths[request.method] ?? []).some(regex => regex.test(path));
  return forwardProtectedApi(request, 'manage/' + path, allowed);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
