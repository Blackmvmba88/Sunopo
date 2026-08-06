import { NextRequest, NextResponse } from "next/server";
import {
  CONTROL_COOKIE_NAME,
  createControlToken,
  getControlSecret,
  isControlAuthenticated,
} from "../auth";

export async function GET(request: NextRequest) {
  const controlSecret = getControlSecret();
  return NextResponse.json({
    authenticated: Boolean(controlSecret && isControlAuthenticated(request)),
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
      response.cookies.set(CONTROL_COOKIE_NAME, createControlToken(controlSecret), {
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
  response.cookies.set(CONTROL_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
