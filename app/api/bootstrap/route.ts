import { NextResponse } from "next/server";
import { ensureFreshAccessToken } from "@/lib/bff/auth-service";
import { ensureCsrfCookie } from "@/lib/bff/csrf";
import { platformFetch } from "@/lib/bff/keycloak";
import { clientKeyFromRequest, rateLimit } from "@/lib/bff/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit(`bootstrap:${clientKeyFromRequest(req)}`, 60, 60_000);
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

  await ensureCsrfCookie();
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

  const [contextRes, capsRes, orgsRes] = await Promise.all([
    platformFetch("/api/v1/platform/context", token),
    platformFetch("/api/v1/platform/me/capabilities", token),
    platformFetch("/api/v1/platform/organizations?page=1&limit=50", token),
  ]);

  if ([contextRes, capsRes, orgsRes].some((r) => r.status === 401)) {
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

  // Context + capabilities are required. Organizations may fall back to
  // capabilities.organizations when the dedicated list is forbidden.
  if (!contextRes.ok || !capsRes.ok) {
    const failed = !contextRes.ok ? contextRes : capsRes;
    const body = await failed.json().catch(() => null);
    return NextResponse.json(
      {
        error: {
          code: "BOOTSTRAP_FAILED",
          message:
            body?.error?.message ?? "Failed to load platform bootstrap",
          details: [
            {
              context: contextRes.status,
              capabilities: capsRes.status,
              organizations: orgsRes.status,
            },
          ],
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
      },
      { status: failed.status >= 400 ? failed.status : 502 },
    );
  }

  const [context, capabilities, organizations] = await Promise.all([
    contextRes.json(),
    capsRes.json(),
    orgsRes.ok ? orgsRes.json() : Promise.resolve(null),
  ]);

  const orgsFromList = organizations?.data ?? null;
  const orgsFromCaps = (capabilities.data?.organizations ?? []).map(
    (o: {
      id: string;
      name: string;
      slug: string;
      status: string;
      keycloakOrganizationId?: string | null;
    }) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      status: o.status,
      keycloakOrganizationId: o.keycloakOrganizationId ?? null,
    }),
  );

  return NextResponse.json({
    data: {
      context: context.data,
      capabilities: capabilities.data,
      organizations: orgsFromList ?? orgsFromCaps,
      pagination: organizations?.pagination,
    },
  });
}
