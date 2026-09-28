import { NextRequest, NextResponse } from "next/server";
import { completeLogin } from "@/lib/bff/auth-service";
import { ensureCsrfCookie } from "@/lib/bff/csrf";
import { appOrigin } from "@/lib/bff/keycloak";
import { getSession } from "@/lib/bff/session";

function redirectAuthError(code: "denied" | "invalid_state" | "failed") {
  return NextResponse.redirect(
    `${appOrigin()}/?authError=${encodeURIComponent(code)}`,
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

  const session = await getSession();
  if (!code || !state || state !== session.oauthState || !session.pkceVerifier) {
    return redirectAuthError("invalid_state");
  }

  try {
    await completeLogin({
      code,
      codeVerifier: session.pkceVerifier,
      redirectUri: `${appOrigin()}/api/auth/callback`,
    });
    await ensureCsrfCookie();
    return NextResponse.redirect(`${appOrigin()}/`);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/callback]", e);
    }
    return redirectAuthError("failed");
  }
}
