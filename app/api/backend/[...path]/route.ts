import { NextRequest, NextResponse } from "next/server";
import { ensureFreshAccessToken, applyTokenResponse } from "@/lib/bff/auth-service";
import { assertCsrf } from "@/lib/bff/csrf";
import { apiBase, refreshAccessToken } from "@/lib/bff/keycloak";
import { getSession } from "@/lib/bff/session";

async function proxy(req: NextRequest, pathParts: string[]) {
  try {
    await assertCsrf(req);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CSRF_REJECTED",
          message: "Invalid CSRF token",
          details: [],
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
      },
      { status: 403 },
    );
  }

  const token = await ensureFreshAccessToken();
  if (!token) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Not authenticated",
          details: [],
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
      },
      { status: 401 },
    );
  }

  const targetPath = `/api/v1/${pathParts.join("/")}${req.nextUrl.search}`;
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set(
    "X-Correlation-Id",
    req.headers.get("x-correlation-id") ?? crypto.randomUUID(),
  );
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Buffer.from(await req.arrayBuffer());
  }

  const res = await fetch(`${apiBase()}${targetPath}`, init);

  if (
    req.method === "POST" &&
    pathParts.join("/") === "platform/organizations/switch" &&
    res.ok
  ) {
    const session = await getSession();
    if (session.refreshToken) {
      try {
        const tokens = await refreshAccessToken(session.refreshToken);
        await applyTokenResponse(session, tokens);
      } catch {
        /* client will re-bootstrap */
      }
    }
  }

  const body = await res.arrayBuffer();
  const out = new Headers();
  const ct = res.headers.get("Content-Type");
  if (ct) out.set("Content-Type", ct);
  const cd = res.headers.get("Content-Disposition");
  if (cd) out.set("Content-Disposition", cd);
  const cc = res.headers.get("Cache-Control");
  if (cc) out.set("Cache-Control", cc);
  return new NextResponse(body, {
    status: res.status,
    headers: out,
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
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
