import { NextResponse } from "next/server";
import {
  edgeAppOrigin,
  edgeAuthEndpoint,
  edgeKeycloakConfig,
  edgePkceChallenge,
  edgeRandomString,
} from "@/lib/edge-bff/keycloak";
import { clientKeyFromRequest, rateLimit } from "@/lib/bff/rate-limit";
import { getEdgeSession } from "@/lib/edge-bff/session";

export async function GET(req: Request) {
  const limited = rateLimit(
    `edge-auth-login:${clientKeyFromRequest(req)}`,
    20,
    60_000,
  );
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
    const { clientId } = edgeKeycloakConfig();
    const verifier = edgeRandomString(32);
    const challenge = await edgePkceChallenge(verifier);
    const state = edgeRandomString(16);
    const redirectUri = `${edgeAppOrigin()}/api/edge-auth/callback`;

    const session = await getEdgeSession();
    session.pkceVerifier = verifier;
    session.oauthState = state;
    await session.save();

    const url = new URL(edgeAuthEndpoint());
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid profile email");
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
