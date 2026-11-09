"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EdgeErrorState, EdgeLoadingState } from "@/components/edge/states";
import { useEdgeSession } from "@/providers/edge-session-provider";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function EdgeSignInCard({
  alert,
  onLogin,
}: {
  alert?: string | null;
  onLogin: () => void;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-canvas)] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 10%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, color-mix(in oklab, var(--secondary) 14%, transparent), transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-md space-y-[var(--space-5)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-8)] elevation-1">
        <div className="space-y-[var(--space-2)]">
          <p className="type-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Admin console
          </p>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
          >
            Okapi Edge
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            Sign in with the Edge administrator realm to manage verticals,
            workspaces, and platform security.
          </p>
        </div>
        {alert ? (
          <p
            role="alert"
            className="rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-[var(--space-3)] py-[var(--space-2)] type-sm text-[var(--danger)]"
          >
            {alert}
          </p>
        ) : null}
        <Button className="w-full" size="lg" onClick={onLogin}>
          Sign in to Okapi Edge
        </Button>
        <p className="type-xs text-[var(--text-muted)]">
          ERP sessions are separate.{" "}
          <Link href="/" className="underline underline-offset-2">
            Open ERP shell
          </Link>
        </p>
      </div>
    </div>
  );
}

function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    denied: "Sign-in was cancelled or denied.",
    invalid_state: "Sign-in state was invalid. Try again.",
    failed: "Sign-in failed. Try again or contact an operator.",
  };
  return map[code] ?? map.failed;
}

function EdgeAuthGateInner({ children }: { children: ReactNode }) {
  const auth = useEdgeSession();
  const platform = useEdgePlatform();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoginRoute = pathname === "/edge/login";
  const alert = authErrorMessage(searchParams.get("authError"));

  useEffect(() => {
    const code = searchParams.get("authError");
    if (!code || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("authError");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [searchParams]);

  useEffect(() => {
    if (auth.status === "authenticated" && isLoginRoute) {
      router.replace("/edge");
    }
  }, [auth.status, isLoginRoute, router]);

  if (auth.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EdgeLoadingState label="Checking Edge session…" />
      </div>
    );
  }

  if (auth.status === "unconfigured") {
    return (
      <EdgeSignInCard
        alert="Edge Keycloak is not configured (EDGE_KEYCLOAK_* / NEXT_PUBLIC_EDGE_*)."
        onLogin={() => auth.login()}
      />
    );
  }

  if (auth.status === "anonymous") {
    return <EdgeSignInCard alert={alert} onLogin={() => auth.login()} />;
  }

  if (isLoginRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EdgeLoadingState label="Opening Okapi Edge…" />
      </div>
    );
  }

  if (platform.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EdgeLoadingState label="Loading Edge console…" />
      </div>
    );
  }

  if (platform.isError) {
    const sessionExpired = /session expired|not authenticated/i.test(
      platform.error?.message ?? "",
    );
    if (sessionExpired) {
      return (
        <EdgeSignInCard
          alert="Your Edge session expired. Sign in again."
          onLogin={() => auth.login()}
        />
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <EdgeErrorState
            title="Could not load Okapi Edge"
            description={
              platform.error?.message ??
              "Bootstrap failed. Retry or sign in again."
            }
            onRetry={() => void platform.refetch()}
          />
          <div className="mt-[var(--space-4)] text-center">
            <Button variant="ghost" onClick={() => auth.login()}>
              Sign in again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function EdgeAuthGate({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <EdgeLoadingState />
        </div>
      }
    >
      <EdgeAuthGateInner>{children}</EdgeAuthGateInner>
    </Suspense>
  );
}
