import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { NextApiRequest } from 'next';
import { timingSafeEqual } from 'node:crypto';

const ADMIN_COOKIE_NAME = 'admin_access_token';
const ADMIN_HEADER_NAME = 'x-admin-access-token';

function parseCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function safeCompare(actual: string | null, expected: string | undefined): boolean {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hasValidAdminAccess(req: NextApiRequest | GetServerSidePropsContext['req']): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  if (!expected) return false;

  const cookieToken = parseCookieValue(req.headers.cookie, ADMIN_COOKIE_NAME);
  const headerRaw = req.headers[ADMIN_HEADER_NAME];
  const headerToken = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw ?? null;

  return safeCompare(cookieToken, expected) || safeCompare(headerToken, expected);
}

export function requireAdminPageAuth(ctx: GetServerSidePropsContext): GetServerSidePropsResult<{ [key: string]: any }> | null {
  if (hasValidAdminAccess(ctx.req)) return null;
  return {
    redirect: {
      destination: '/',
      permanent: false
    }
  };
}

export { ADMIN_COOKIE_NAME, ADMIN_HEADER_NAME };
