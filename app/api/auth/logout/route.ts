import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/bff/csrf";
import { appOrigin, keycloakConfig, logoutEndpoint } from "@/lib/bff/keycloak";
import { getSession } from "@/lib/bff/session";

export async function POST(req: Request) {
  try {
    await assertCsrf(req);
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

  const session = await getSession();
  const idToken = session.idToken;
  session.destroy();

  try {
    const { clientId } = keycloakConfig();
    if (idToken) {
      const url = new URL(logoutEndpoint());
      url.searchParams.set("id_token_hint", idToken);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("post_logout_redirect_uri", appOrigin());
      return NextResponse.json({ data: { logoutUrl: url.toString() } });
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({ data: { logoutUrl: appOrigin() } });
}

/** GET logout skips CSRF (used as redirect fallback); prefer POST from SPA. */
export async function GET() {
  const session = await getSession();
  const idToken = session.idToken;
  session.destroy();
  try {
    const { clientId } = keycloakConfig();
    if (idToken) {
      const url = new URL(logoutEndpoint());
      url.searchParams.set("id_token_hint", idToken);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("post_logout_redirect_uri", appOrigin());
      return NextResponse.redirect(url.toString());
    }
  } catch {
    /* ignore */
  }
  return NextResponse.redirect(appOrigin());
}
