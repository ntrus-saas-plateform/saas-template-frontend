import { NextResponse } from "next/server";
import { publicSessionView, ensureFreshAccessToken } from "@/lib/bff/auth-service";
import { ensureCsrfCookie } from "@/lib/bff/csrf";
import { getSession } from "@/lib/bff/session";

export async function GET() {
  await ensureFreshAccessToken();
  const csrfToken = await ensureCsrfCookie();
  const session = await getSession();
  return NextResponse.json({
    data: {
      ...publicSessionView(session),
      csrfToken,
    },
  });
}
