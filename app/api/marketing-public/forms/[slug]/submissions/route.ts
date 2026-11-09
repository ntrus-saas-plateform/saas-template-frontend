import { NextRequest, NextResponse } from "next/server";
import { edgeApiBase } from "@/lib/edge-bff/keycloak";

/**
 * Public acquisition form proxy — no Edge session.
 * Edge BFF CSRF/auth intentionally bypassed; backend @Public + Throttle remain SoT.
 * Additional edge-side IP throttle softens burst traffic before backend.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (!slug || !/^[a-z0-9-]{2,128}$/i.test(slug)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid form slug",
        },
      },
      { status: 400 },
    );
  }

  if (!rateLimit(clientKey(req))) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many form submissions from this client",
        },
      },
      { status: 429 },
    );
  }

  const body = await req.text();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set(
    "X-Correlation-Id",
    req.headers.get("x-correlation-id") ?? crypto.randomUUID(),
  );
  const idem = req.headers.get("idempotency-key");
  if (idem) headers.set("Idempotency-Key", idem);

  const res = await fetch(
    `${edgeApiBase()}/api/v1/edge/marketing/forms/public/${encodeURIComponent(slug)}/submissions`,
    {
      method: "POST",
      headers,
      body,
    },
  );

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
