import { NextRequest, NextResponse } from "next/server";
import { edgeApiBase } from "@/lib/edge-bff/keycloak";

/**
 * Public acquisition proxy — no Edge session.
 * Edge BFF CSRF/auth intentionally bypassed; backend @Public + Throttle remain SoT.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

const ALLOWED_PREFIXES = [
  "products",
  "plans",
  "forms/",
  "leads",
  "challenge",
  "analytics/events",
  "checkout/",
  "checkout",
];

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

function isAllowedPath(joined: string): boolean {
  return ALLOWED_PREFIXES.some(
    (p) => joined === p || joined.startsWith(p) || joined.startsWith(`${p}`),
  );
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const joined = pathParts.join("/");
  if (!joined || joined.includes("..") || !isAllowedPath(joined)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid public acquisition path",
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
          message: "Too many public acquisition requests from this client",
        },
      },
      { status: 429 },
    );
  }

  const headers = new Headers();
  headers.set(
    "X-Correlation-Id",
    req.headers.get("x-correlation-id") ?? crypto.randomUUID(),
  );
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const idem = req.headers.get("idempotency-key");
  if (idem) headers.set("Idempotency-Key", idem);

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Buffer.from(await req.arrayBuffer());
  }

  const target = `${edgeApiBase()}/api/v1/edge/acquisition/public/${joined}${req.nextUrl.search}`;
  const res = await fetch(target, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
