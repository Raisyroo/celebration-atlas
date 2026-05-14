import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { createHash, timingSafeEqual } from 'crypto';

const ADMIN_COOKIE_NAME = 'admin_access';
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [name, ...rest] = pair.split('=');
      if (!name || rest.length === 0) return acc;
      acc[name] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
}

function getExpectedToken(): string | null {
  return process.env.ADMIN_ACCESS_TOKEN?.trim() || null;
}

export function isAdminAuthenticated(req: NextApiRequest | GetServerSidePropsContext['req']): boolean {
  const expected = getExpectedToken();
  if (!expected) return false;

  const cookies = parseCookieHeader(req.headers.cookie);
  const candidate = cookies[ADMIN_COOKIE_NAME];
  if (!candidate) return false;

  const a = sha256(candidate);
  const b = sha256(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function setAdminCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ONE_WEEK_SECONDS};${secure}`);
}

export function clearAdminCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;${secure}`);
}

export const requireAdminApi = (handler: NextApiHandler): NextApiHandler => {
  return async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res);
  };
};

export function withAdminPageAuth<P extends { [key: string]: unknown }>(
  inner: GetServerSideProps<P>
): GetServerSideProps<P> {
  return async (ctx): Promise<GetServerSidePropsResult<P>> => {
    if (!isAdminAuthenticated(ctx.req)) {
      return {
        redirect: {
          destination: '/admin/login',
          permanent: false
        }
      };
    }
    return inner(ctx);
  };
}

export function isValidAdminToken(input: unknown): boolean {
  if (typeof input !== 'string' || input.length === 0) return false;
  const expected = getExpectedToken();
  if (!expected) return false;
  const a = sha256(input);
  const b = sha256(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
