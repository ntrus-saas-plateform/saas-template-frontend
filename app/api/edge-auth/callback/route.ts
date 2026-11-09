import { NextRequest, NextResponse } from "next/server";
import { completeEdgeLogin } from "@/lib/edge-bff/auth-service";
import { ensureEdgeCsrfCookie } from "@/lib/edge-bff/csrf";
import { edgeAppOrigin } from "@/lib/edge-bff/keycloak";
import { getEdgeSession } from "@/lib/edge-bff/session";

function redirectAuthError(code: "denied" | "invalid_state" | "failed") {
  return NextResponse.redirect(
    `${edgeAppOrigin()}/edge/login?authError=${encodeURIComponent(code)}`,
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    return redirectAuthError("denied");
  }

  const session = await getEdgeSession();
  if (
    !code ||
    !state ||
    state !== session.oauthState ||
    !session.pkceVerifier
  ) {
    return redirectAuthError("invalid_state");
  }

  try {
    await completeEdgeLogin({
      code,
      codeVerifier: session.pkceVerifier,
      redirectUri: `${edgeAppOrigin()}/api/edge-auth/callback`,
    });
    await ensureEdgeCsrfCookie();
    return NextResponse.redirect(`${edgeAppOrigin()}/edge`);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[edge-auth/callback]", e);
    }
    return redirectAuthError("failed");
  }
}
