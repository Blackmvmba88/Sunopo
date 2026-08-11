import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const CONTROL_SESSION_COOKIE = "sunopo_control_session";
export const CONTROL_CSRF_COOKIE = "sunopo_control_csrf";
export const CONTROL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type ControlSession = {
  expiresAt: number;
  issuedAt: number;
  nonce: string;
  version: 1;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function configuredControlSecret() {
  return process.env.CONTROL_SECRET;
}

export function configuredSessionSecret() {
  return process.env.CONTROL_SESSION_SECRET;
}

export function secretsAreConfigured() {
  return Boolean(configuredControlSecret() && configuredSessionSecret());
}

export function secretMatches(candidate: string, expected: string) {
  const candidateDigest = createHmac("sha256", expected).update(candidate).digest();
  const expectedDigest = createHmac("sha256", expected).update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function createControlSession(
  secret: string,
  now = Date.now(),
  nonce = randomBytes(18).toString("base64url"),
) {
  const session: ControlSession = {
    version: 1,
    issuedAt: now,
    expiresAt: now + CONTROL_SESSION_MAX_AGE_SECONDS * 1000,
    nonce,
  };
  const payload = encode(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyControlSession(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!token || !secret) return false;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;

  const expected = sign(payload, secret);
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(decode(payload)) as Partial<ControlSession>;
    return (
      session.version === 1 &&
      typeof session.issuedAt === "number" &&
      typeof session.expiresAt === "number" &&
      typeof session.nonce === "string" &&
      session.issuedAt <= now &&
      session.expiresAt > now
    );
  } catch {
    return false;
  }
}

export function createCsrfToken() {
  return randomBytes(24).toString("base64url");
}

export function csrfMatches(cookieToken?: string, headerToken?: string | null) {
  if (!cookieToken || !headerToken) return false;
  const cookieBytes = Buffer.from(cookieToken);
  const headerBytes = Buffer.from(headerToken);
  return (
    cookieBytes.length === headerBytes.length &&
    timingSafeEqual(cookieBytes, headerBytes)
  );
}
