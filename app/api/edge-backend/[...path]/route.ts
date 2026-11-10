import { NextRequest, NextResponse } from "next/server";
import {
  applyEdgeTokenResponse,
  ensureFreshEdgeAccessToken,
} from "@/lib/edge-bff/auth-service";
import { assertEdgeCsrf } from "@/lib/edge-bff/csrf";
import { edgeApiBase, edgeRefreshAccessToken } from "@/lib/edge-bff/keycloak";
import { getEdgeSession } from "@/lib/edge-bff/session";

const WORKSPACE_TOKEN_PATHS = new Set([
  "workspaces/switch",
  "workspaces/bootstrap",
]);

async function proxy(req: NextRequest, pathParts: string[]) {
  try {
    await assertEdgeCsrf(req);
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

  const token = await ensureFreshEdgeAccessToken();
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

  const joined = pathParts.join("/");
  const targetPath = `/api/v1/edge/${joined}${req.nextUrl.search}`;
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set(
    "X-Correlation-Id",
    req.headers.get("x-correlation-id") ?? crypto.randomUUID(),
  );
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

  const session = await getEdgeSession();
  if (session.workspaceSessionToken) {
    headers.set("x-edge-workspace-session", session.workspaceSessionToken);
    headers.set("x-edge-workspace-token", session.workspaceSessionToken);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Buffer.from(await req.arrayBuffer());
  }

  const res = await fetch(`${edgeApiBase()}${targetPath}`, init);

  if (req.method === "POST" && joined === "workspaces/revoke" && res.ok) {
    session.workspaceSessionToken = undefined;
    session.activeVerticalId = undefined;
    await session.save();
  }

  if (req.method === "POST" && joined === "workspaces/revoke-all" && res.ok) {
    session.workspaceSessionToken = undefined;
    session.activeVerticalId = undefined;
    await session.save();
  }

  if (req.method === "POST" && WORKSPACE_TOKEN_PATHS.has(joined) && res.ok) {
    let stripped: unknown | null = null;
    try {
      const json = (await res.clone().json()) as {
        data?: {
          token?: string;
          session?: { verticalId?: string };
        };
      };
      const opaque = json.data?.token;
      if (opaque) {
        session.workspaceSessionToken = opaque;
        session.activeVerticalId =
          json.data?.session?.verticalId ?? session.activeVerticalId;
        await session.save();
      }
      // Strip opaque token from browser-visible payload.
      if (json.data && "token" in json.data) {
        const restData = { ...json.data };
        delete restData.token;
        stripped = { ...json, data: restData };
      }
    } catch {
      /* fall through with raw body */
    }

    if (session.refreshToken) {
      try {
        const tokens = await edgeRefreshAccessToken(session.refreshToken);
        await applyEdgeTokenResponse(session, tokens);
      } catch {
        /* client will re-bootstrap */
      }
    }

    if (stripped) {
      return NextResponse.json(stripped, { status: res.status });
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
