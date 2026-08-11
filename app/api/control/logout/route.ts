import { NextRequest, NextResponse } from "next/server";

import {
  CONTROL_CSRF_COOKIE,
  CONTROL_SESSION_COOKIE,
  configuredSessionSecret,
  csrfMatches,
  verifyControlSession,
} from "@/lib/control-auth";

export async function POST(request: NextRequest) {
  const session = request.cookies.get(CONTROL_SESSION_COOKIE)?.value;
  if (!verifyControlSession(session, configuredSessionSecret())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrf = request.cookies.get(CONTROL_CSRF_COOKIE)?.value;
  if (!csrfMatches(csrf, request.headers.get("x-csrf-token"))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(CONTROL_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(CONTROL_CSRF_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
