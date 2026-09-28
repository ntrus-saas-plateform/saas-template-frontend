"use client";

import type { AuthSession, AuthUser } from "@/lib/auth/types";
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/bff/csrf-constants";

async function readSession(): Promise<{
  authenticated: boolean;
  user: AuthUser | null;
}> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) return { authenticated: false, user: null };
  const json = (await res.json()) as {
    data?: { authenticated?: boolean; user?: AuthUser | null };
  };
  return {
    authenticated: Boolean(json.data?.authenticated),
    user: json.data?.user ?? null,
  };
}

function readBrowserCsrf(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function createBffAuthSessionHandlers(): Omit<AuthSession, "status"> {
  return {
    user: null,
    getAccessToken: async () => undefined,
    login: async () => {
      // OAuth must leave the SPA document; router.push is insufficient for BFF login.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full navigation to Route Handler
      window.location.assign("/api/auth/login");
    },
    logout: async () => {
      const headers = new Headers();
      const csrf = readBrowserCsrf();
      if (csrf) headers.set(CSRF_HEADER, csrf);
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers,
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { logoutUrl?: string };
      };
      window.location.assign(json.data?.logoutUrl || "/");
    },
    refreshToken: async () => {
      const s = await readSession();
      return s.authenticated;
    },
  };
}

export { readSession as readBffSession };
