import { cookies } from 'next/headers';

export const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

export async function getAuthenticated<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get('med06_session')?.value;
  if (!token) return null;
  try {
    const response = await fetch(`${backendUrl}/api/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', signal: AbortSignal.timeout(7000),
    });
    return response.ok ? (await response.json()) as T : null;
  } catch { return null; }
}
