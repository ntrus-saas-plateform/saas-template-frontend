import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  OKAPI_EDGE_CSRF_COOKIE,
  OKAPI_EDGE_CSRF_HEADER,
} from "@/lib/edge-bff/csrf-constants";

export { OKAPI_EDGE_CSRF_COOKIE, OKAPI_EDGE_CSRF_HEADER };

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function isEdgeSafeMethod(method: string) {
  return SAFE.has(method.toUpperCase());
}

export async function ensureEdgeCsrfCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(OKAPI_EDGE_CSRF_COOKIE)?.value;
  if (existing && existing.length >= 32) return existing;

  const token = randomBytes(32).toString("hex");
  jar.set(OKAPI_EDGE_CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return token;
}

export async function assertEdgeCsrf(req: Request): Promise<void> {
  if (isEdgeSafeMethod(req.method)) {
    await ensureEdgeCsrfCookie();
    return;
  }

  const jar = await cookies();
  const cookieToken = jar.get(OKAPI_EDGE_CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(OKAPI_EDGE_CSRF_HEADER) ?? undefined;

  if (!cookieToken || !headerToken || !tokensMatch(cookieToken, headerToken)) {
    const err = new Error("Invalid CSRF token");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

function tokensMatch(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
