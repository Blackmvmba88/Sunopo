import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST as login } from "../app/api/control/login/route";
import { POST as logout } from "../app/api/control/logout/route";
import {
  CONTROL_CSRF_COOKIE,
  CONTROL_SESSION_COOKIE,
  CONTROL_SESSION_MAX_AGE_SECONDS,
  createControlSession,
  csrfMatches,
  secretMatches,
  verifyControlSession,
} from "../lib/control-auth";

describe("control authentication", () => {
  const signingSecret = "test-signing-secret-with-enough-entropy";
  const now = Date.UTC(2026, 7, 10, 12, 0, 0);

  it("accepts a valid server-issued session", () => {
    const token = createControlSession(signingSecret, now, "fixed-nonce");
    expect(verifyControlSession(token, signingSecret, now + 1_000)).toBe(true);
  });

  it("rejects tampered, expired, and incorrectly signed sessions", () => {
    const token = createControlSession(signingSecret, now, "fixed-nonce");
    expect(verifyControlSession(`${token}x`, signingSecret, now)).toBe(false);
    expect(verifyControlSession(token, "different-secret", now)).toBe(false);
    expect(
      verifyControlSession(
        token,
        signingSecret,
        now + CONTROL_SESSION_MAX_AGE_SECONDS * 1_000 + 1,
      ),
    ).toBe(false);
  });

  it("compares credentials and CSRF values without plain equality", () => {
    expect(secretMatches("correct", "correct")).toBe(true);
    expect(secretMatches("wrong", "correct")).toBe(false);
    expect(csrfMatches("csrf-token", "csrf-token")).toBe(true);
    expect(csrfMatches("csrf-token", "other-token")).toBe(false);
    expect(csrfMatches(undefined, "csrf-token")).toBe(false);
  });
});

describe("control auth routes", () => {
  it("rejects unauthorized access and issues an HttpOnly session on success", async () => {
    process.env.CONTROL_SECRET = "correct-control-secret";
    process.env.CONTROL_SESSION_SECRET = "test-signing-secret-with-enough-entropy";

    const unauthorized = await login(
      new NextRequest("http://localhost/api/control/login", {
        method: "POST",
        body: JSON.stringify({ secret: "wrong" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await login(
      new NextRequest("http://localhost/api/control/login", {
        method: "POST",
        body: JSON.stringify({ secret: "correct-control-secret" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(authorized.status).toBe(200);
    expect(authorized.cookies.get(CONTROL_SESSION_COOKIE)?.value).toBeTruthy();
    expect(authorized.headers.get("set-cookie")).toContain("HttpOnly");
    expect(authorized.cookies.get(CONTROL_CSRF_COOKIE)?.value).toBeTruthy();
  });

  it("requires CSRF for logout and revokes both cookies", async () => {
    const signingSecret = "test-signing-secret-with-enough-entropy";
    process.env.CONTROL_SESSION_SECRET = signingSecret;
    const session = createControlSession(signingSecret);
    const cookie = `${CONTROL_SESSION_COOKIE}=${session}; ${CONTROL_CSRF_COOKIE}=csrf-token`;

    const forbidden = await logout(
      new NextRequest("http://localhost/api/control/logout", {
        method: "POST",
        headers: { cookie },
      }),
    );
    expect(forbidden.status).toBe(403);

    const accepted = await logout(
      new NextRequest("http://localhost/api/control/logout", {
        method: "POST",
        headers: { cookie, "x-csrf-token": "csrf-token" },
      }),
    );
    expect(accepted.status).toBe(200);
    expect(accepted.cookies.get(CONTROL_SESSION_COOKIE)?.value).toBe("");
    expect(accepted.cookies.get(CONTROL_CSRF_COOKIE)?.value).toBe("");
  });
});
