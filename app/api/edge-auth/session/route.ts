import { NextResponse } from "next/server";
import {
  ensureFreshEdgeAccessToken,
  publicEdgeSessionView,
} from "@/lib/edge-bff/auth-service";
import { ensureEdgeCsrfCookie } from "@/lib/edge-bff/csrf";
import { getEdgeSession } from "@/lib/edge-bff/session";

export async function GET() {
  await ensureFreshEdgeAccessToken();
  const csrfToken = await ensureEdgeCsrfCookie();
  const session = await getEdgeSession();
  return NextResponse.json({
    data: {
      ...publicEdgeSessionView(session),
      csrfToken,
    },
  });
}
