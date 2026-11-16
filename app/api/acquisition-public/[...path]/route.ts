import { createHash } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { edgeApiBase } from "@/lib/edge-bff/keycloak";

/**
 * Public acquisition proxy — no Edge session.
 * Edge BFF CSRF/auth intentionally bypassed; backend @Public + Throttle remain SoT.
 *
 * Production security boundary is Nest Throttle + AcquisitionPublicRateLimiter,
 * not this process-local Map. BFF rate limit is advisory only (per-instance).
 */
const WINDOW_MS = 60_000;
/** GET/HEAD advisory cap per window. */
const MAX_GET_PER_WINDOW = 60;
/** POST advisory cap — tightened; Nest leads throttle is also 20/min. */
const MAX_POST_PER_WINDOW = 20;
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

function hashUa(ua: string): string {
  return createHash("sha256").update(ua).digest("hex").slice(0, 16);
}

/**
 * Client key for advisory BFF rate limiting.
 * Prefer connection-derived identity; do not treat spoofable XFF as sole key.
 * When EDGE_TRUST_PROXY=1, use leftmost XFF after strip (trusted edge only).
 * Otherwise key by unknown-edge + UA hash (backend AcquisitionPublicRateLimiter is SoT).
 */
function clientKey(req: NextRequest): string {
  const trustProxy = process.env.EDGE_TRUST_PROXY === "1";
  const ua = req.headers.get("user-agent") ?? "";

  if (trustProxy) {
    const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (xff) return `xff:${xff}`;
    const cf = req.headers.get("cf-connecting-ip")?.trim();
    if (cf) return `cf:${cf}`;
    const realIp = req.headers.get("x-real-ip")?.trim();
    if (realIp) return `real:${realIp}`;
  } else {
    // Headers-only environments (serverless): hash cf-connecting-ip when present,
    // else unknown-edge + UA — never trust raw XFF as the only key.
    const cf = req.headers.get("cf-connecting-ip")?.trim();
    if (cf) return `cf:${cf}`;
  }

  return `unknown-edge:${hashUa(ua)}`;
}

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

function isAllowedPath(joined: string): boolean {
  return ALLOWED_PREFIXES.some(
    (p) => joined === p || joined.startsWith(p) || joined.startsWith(`${p}`),
  );
}

/** Decode, normalize, and reject path traversal / absolute escapes. */
function sanitizePublicPath(pathParts: string[]): string | null {
  const decoded: string[] = [];
  for (const part of pathParts) {
    let segment: string;
    try {
      segment = decodeURIComponent(part);
    } catch {
      return null;
    }
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0")
    ) {
      return null;
    }
    decoded.push(segment);
  }
  const joined = decoded.join("/");
  if (!joined || joined.includes("..")) return null;
  const normalized = path.posix.normalize(joined);
  if (normalized !== joined || normalized.startsWith("..") || path.posix.isAbsolute(normalized)) {
    return null;
  }
  if (!isAllowedPath(joined)) return null;
  return joined;
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const joined = sanitizePublicPath(pathParts);
  if (!joined) {
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

  const max =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
      ? MAX_POST_PER_WINDOW
      : MAX_GET_PER_WINDOW;

  if (!rateLimit(clientKey(req), max)) {
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
