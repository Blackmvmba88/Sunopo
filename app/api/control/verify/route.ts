import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "SUNOPO_CONTROL_AUTH";

function getControlSecret(): string | null {
  return process.env.CONTROL_SECRET || null;
}

function createToken(secret: string): string {
  return createHmac("sha256", secret).update("sunopo-control").digest("hex");
}

function hasValidToken(request: NextRequest, secret: string): boolean {
  const supplied = request.cookies.get(COOKIE_NAME)?.value;
  if (!supplied) return false;

  const expected = createToken(secret);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export async function GET(request: NextRequest) {
  const controlSecret = getControlSecret();
  return NextResponse.json({
    authenticated: Boolean(controlSecret && hasValidToken(request, controlSecret)),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    const controlSecret = getControlSecret();
    if (!controlSecret) {
      return NextResponse.json(
        { success: false, message: "Control panel is not configured" },
        { status: 503 }
      );
    }

    if (secret === controlSecret) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, createToken(controlSecret), {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid secret" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Control verification error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
