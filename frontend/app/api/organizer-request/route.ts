import { NextRequest } from 'next/server';
import { forwardProtectedApi } from '../../../lib/auth-proxy';

export async function GET(request: NextRequest) {
  return forwardProtectedApi(request, 'auth/organizer-request', true);
}
export async function POST(request: NextRequest) {
  return forwardProtectedApi(request, 'auth/organizer-request', true);
}
