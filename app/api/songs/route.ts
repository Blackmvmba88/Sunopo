import { NextRequest, NextResponse } from 'next/server';
import { isControlAuthenticated } from '../control/auth';

export async function GET(request: NextRequest) {
  if (!isControlAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5555';
    const search = request.nextUrl.search;
    const response = await fetch(`${backendUrl}/api/songs${search}`, {
      headers: {
        ...(request.headers.get('authorization')
          ? { Authorization: request.headers.get('authorization')! }
          : {}),
        ...(request.headers.get('cookie')
          ? { Cookie: request.headers.get('cookie')! }
          : {}),
        ...(request.headers.get('x-session-token')
          ? { 'X-Session-Token': request.headers.get('x-session-token')! }
          : {}),
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok || !data) {
      return NextResponse.json(
        { error: data?.error || 'Unable to load the Suno catalog' },
        { status: response.ok ? 502 : response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'Suno catalog request timed out' : 'Catalog service unavailable' },
      { status: isTimeout ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
