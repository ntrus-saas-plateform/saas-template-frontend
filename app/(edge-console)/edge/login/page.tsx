"use client";

/**
 * Dedicated login route. Renders the Edge sign-in gate; authenticated
 * visitors are redirected to /edge by EdgeAuthGate / this page.
 */
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EdgeSignInCard,
} from "@/components/edge/edge-auth-gate";
import { EdgeLoadingState } from "@/components/edge/states";
import { useEdgeSession } from "@/providers/edge-session-provider";

function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    denied: "Sign-in was cancelled or denied.",
    invalid_state: "Sign-in state was invalid. Try again.",
    failed: "Sign-in failed. Try again or contact an operator.",
  };
  return map[code] ?? map.failed;
}

function EdgeLoginInner() {
  const auth = useEdgeSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const alert = authErrorMessage(searchParams.get("authError"));

  useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace("/edge");
    }
  }, [auth.status, router]);

  if (auth.status === "loading" || auth.status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EdgeLoadingState label="Opening Okapi Edge…" />
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

  return <EdgeSignInCard alert={alert} onLogin={() => auth.login()} />;
}

export default function EdgeLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <EdgeLoadingState label="Loading sign-in…" />
        </div>
      }
    >
      <EdgeLoginInner />
    </Suspense>
  );
}
