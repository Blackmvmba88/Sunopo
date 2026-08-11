import { NextRequest, NextResponse } from "next/server";

import {
  CONTROL_CSRF_COOKIE,
  CONTROL_SESSION_COOKIE,
  CONTROL_SESSION_MAX_AGE_SECONDS,
  configuredControlSecret,
  configuredSessionSecret,
  createControlSession,
  createCsrfToken,
  secretMatches,
} from "@/lib/control-auth";

export async function POST(request: NextRequest) {
  const controlSecret = configuredControlSecret();
  const sessionSecret = configuredSessionSecret();
  if (!controlSecret || !sessionSecret) {
    return NextResponse.json(
      { error: "Control authentication is not configured" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { secret?: unknown } | null;
  if (typeof body?.secret !== "string" || !secretMatches(body.secret, controlSecret)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    CONTROL_SESSION_COOKIE,
    createControlSession(sessionSecret),
    {
      httpOnly: true,
      maxAge: CONTROL_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    },
  );
  response.cookies.set(CONTROL_CSRF_COOKIE, createCsrfToken(), {
    httpOnly: false,
    maxAge: CONTROL_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
