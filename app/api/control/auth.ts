import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';

export const CONTROL_COOKIE_NAME = 'SUNOPO_CONTROL_AUTH';

export function getControlSecret(): string | null {
  return process.env.CONTROL_SECRET || null;
}

export function createControlToken(secret: string): string {
  return createHmac('sha256', secret).update('sunopo-control').digest('hex');
}

export function isControlAuthenticated(request: NextRequest): boolean {
  const secret = getControlSecret();
  const supplied = request.cookies.get(CONTROL_COOKIE_NAME)?.value;
  if (!secret || !supplied) return false;

  const expected = createControlToken(secret);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}
