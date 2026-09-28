import { NextResponse } from "next/server";
import {
  appOrigin,
  authEndpoint,
  keycloakConfig,
  pkceChallenge,
  randomString,
} from "@/lib/bff/keycloak";
import { clientKeyFromRequest, rateLimit } from "@/lib/bff/rate-limit";
import { getSession } from "@/lib/bff/session";

export async function GET(req: Request) {
  const limited = rateLimit(`auth-login:${clientKeyFromRequest(req)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many login attempts. Try again shortly.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const { clientId } = keycloakConfig();
    const verifier = randomString(32);
    const challenge = await pkceChallenge(verifier);
    const state = randomString(16);
    const redirectUri = `${appOrigin()}/api/auth/callback`;

    const session = await getSession();
    session.pkceVerifier = verifier;
    session.oauthState = state;
    await session.save();

    const url = new URL(authEndpoint());
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid profile email organization");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");

    return NextResponse.redirect(url.toString());
  } catch (e) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_CONFIG_ERROR",
          message: e instanceof Error ? e.message : "Auth config error",
        },
      },
      { status: 500 },
    );
  }
}
