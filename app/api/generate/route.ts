import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Proxy the request to the Flask backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5555';
    const response = await fetch(`${backendUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real scenario, we might want to pass through headers like Authorization or Cookies
        // but for now, the Flask backend handles session from its own config/files if not provided.
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Error from generation backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error in API proxy' },
      { status: 500 }
    );
  }
}
