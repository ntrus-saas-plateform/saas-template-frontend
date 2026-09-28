import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/bff/csrf-constants";

export { CSRF_COOKIE, CSRF_HEADER };

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSafeMethod(method: string) {
  return SAFE.has(method.toUpperCase());
}

export async function ensureCsrfCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE)?.value;
  if (existing && existing.length >= 32) return existing;

  const token = randomBytes(32).toString("hex");
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return token;
}

export async function assertCsrf(req: Request): Promise<void> {
  if (isSafeMethod(req.method)) {
    await ensureCsrfCookie();
    return;
  }

  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER) ?? undefined;

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
