import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);

  try {
    const body = await request.json();

    // Proxy the request to the Flask backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5555';
    const response = await fetch(`${backendUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const responseData = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData?.error || 'Error from generation backend' },
        { status: response.status }
      );
    }

    if (!responseData) {
      return NextResponse.json(
        { error: 'Invalid response from generation backend' },
        { status: 502 }
      );
    }
    return NextResponse.json(responseData);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.error('Proxy error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: isTimeout ? 'Generation backend timed out' : 'Internal server error in API proxy' },
      { status: isTimeout ? 504 : 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
