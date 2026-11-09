import { NextResponse } from "next/server";
import { assertEdgeCsrf } from "@/lib/edge-bff/csrf";
import {
  edgeAppOrigin,
  edgeKeycloakConfig,
  edgeLogoutEndpoint,
} from "@/lib/edge-bff/keycloak";
import { getEdgeSession } from "@/lib/edge-bff/session";

export async function POST(req: Request) {
  try {
    await assertEdgeCsrf(req);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CSRF_REJECTED",
          message: "Invalid CSRF token",
        },
      },
      { status: 403 },
    );
  }

  const session = await getEdgeSession();
  const idToken = session.idToken;
  session.destroy();

  try {
    const { clientId } = edgeKeycloakConfig();
    if (idToken) {
      const url = new URL(edgeLogoutEndpoint());
      url.searchParams.set("id_token_hint", idToken);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set(
        "post_logout_redirect_uri",
        `${edgeAppOrigin()}/edge/login`,
      );
      return NextResponse.json({ data: { logoutUrl: url.toString() } });
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    data: { logoutUrl: `${edgeAppOrigin()}/edge/login` },
  });
}

/** GET logout skips CSRF (used as redirect fallback); prefer POST from SPA. */
export async function GET() {
  const session = await getEdgeSession();
  const idToken = session.idToken;
  session.destroy();
  try {
    const { clientId } = edgeKeycloakConfig();
    if (idToken) {
      const url = new URL(edgeLogoutEndpoint());
      url.searchParams.set("id_token_hint", idToken);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set(
        "post_logout_redirect_uri",
        `${edgeAppOrigin()}/edge/login`,
      );
      return NextResponse.redirect(url.toString());
    }
  } catch {
    /* ignore */
  }
  return NextResponse.redirect(`${edgeAppOrigin()}/edge/login`);
}
