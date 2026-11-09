import { NextResponse } from "next/server";
import { ensureFreshEdgeAccessToken } from "@/lib/edge-bff/auth-service";
import { ensureEdgeCsrfCookie } from "@/lib/edge-bff/csrf";
import { edgePlatformFetch } from "@/lib/edge-bff/keycloak";
import { getEdgeSession } from "@/lib/edge-bff/session";
import { clientKeyFromRequest, rateLimit } from "@/lib/bff/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit(
    `edge-bootstrap:${clientKeyFromRequest(req)}`,
    60,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many bootstrap requests",
          details: [],
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  await ensureEdgeCsrfCookie();
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

  const session = await getEdgeSession();
  const workspaceToken = session.workspaceSessionToken;

  const [meRes, workspacesRes, activeRes] = await Promise.all([
    edgePlatformFetch("/api/v1/edge/administrators/me", token),
    edgePlatformFetch("/api/v1/edge/workspaces", token, {
      workspaceSessionToken: workspaceToken,
    }),
    workspaceToken
      ? edgePlatformFetch("/api/v1/edge/workspaces/active", token, {
          workspaceSessionToken: workspaceToken,
        })
      : Promise.resolve(null),
  ]);

  if ([meRes, workspacesRes].some((r) => r.status === 401)) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Session expired",
          details: [],
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
      },
      { status: 401 },
    );
  }

  if (!meRes.ok) {
    const body = await meRes.json().catch(() => null);
    return NextResponse.json(
      {
        error: {
          code: "BOOTSTRAP_FAILED",
          message: body?.error?.message ?? "Failed to load Edge administrator",
          details: [{ me: meRes.status, workspaces: workspacesRes.status }],
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
      },
      { status: meRes.status >= 400 ? meRes.status : 502 },
    );
  }

  const meJson = await meRes.json();
  const workspacesJson = workspacesRes.ok
    ? await workspacesRes.json()
    : { data: [] };
  const activeJson =
    activeRes && activeRes.ok ? await activeRes.json() : { data: null };

  let permissions: string[] = [];
  const adminId = meJson?.data?.id as string | undefined;
  if (adminId) {
    const verticalId =
      (activeJson?.data?.vertical?.id as string | undefined) ??
      session.activeVerticalId ??
      undefined;
    const qs = verticalId
      ? `?verticalId=${encodeURIComponent(verticalId)}`
      : "";
    const permsRes = await edgePlatformFetch(
      `/api/v1/edge/administrators/${adminId}/effective-permissions${qs}`,
      token,
      { workspaceSessionToken: workspaceToken },
    );
    if (permsRes.ok) {
      const permsJson = await permsRes.json();
      const raw = permsJson?.data;
      if (Array.isArray(raw)) {
        permissions = raw.filter((p): p is string => typeof p === "string");
      } else if (Array.isArray(raw?.permissions)) {
        permissions = raw.permissions.filter(
          (p: unknown): p is string => typeof p === "string",
        );
      } else if (Array.isArray(raw?.codes)) {
        permissions = raw.codes.filter(
          (p: unknown): p is string => typeof p === "string",
        );
      }
    }
  }

  return NextResponse.json({
    data: {
      me: meJson.data,
      workspaces: workspacesJson.data ?? [],
      activeWorkspace: activeJson?.data ?? null,
      permissions,
      activeVerticalId: session.activeVerticalId ?? null,
      hasWorkspaceSession: Boolean(workspaceToken),
    },
  });
}
