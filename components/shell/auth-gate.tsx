"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ShellChrome } from "@/components/shell/shell-chrome";
import { SignInScreen } from "@/components/shell/sign-in-screen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";
import { usePlatform } from "@/providers/platform-provider";
import { OrgSwitcher } from "@/components/shell/org-switcher";
import { detectLocale, t, type MessageKey } from "@/lib/i18n/messages";
import { reportClientError } from "@/lib/observability/errors";

function BootSkeleton() {
  return (
    <div
      className="signin-dark relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="signin-dark__card w-full max-w-[420px] space-y-4 px-8 py-10">
        <Skeleton className="mx-auto h-12 w-12 rounded-full bg-white/10" />
        <Skeleton className="mx-auto h-7 w-48 bg-white/10" />
        <Skeleton className="mx-auto h-4 w-64 bg-white/10" />
        <Skeleton className="mt-4 h-12 w-full rounded-xl bg-blue-600/40" />
      </div>
    </div>
  );
}

function authErrorMessage(
  code: string | null,
  locale: ReturnType<typeof detectLocale>,
): string | null {
  if (!code) return null;
  const map: Record<string, MessageKey> = {
    denied: "auth.errorDenied",
    invalid_state: "auth.errorInvalidState",
    failed: "auth.errorFailed",
  };
  return t(locale, map[code] ?? "auth.errorFailed");
}

function AuthGateInner({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const platform = usePlatform();
  const locale = detectLocale();
  const searchParams = useSearchParams();
  const [authAlert, setAuthAlert] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("authError");
    const msg = authErrorMessage(code, locale);
    if (msg) setAuthAlert(msg);
    if (code && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("authError");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams, locale]);

  useEffect(() => {
    if (auth.status === "unconfigured" && process.env.NODE_ENV === "development") {
      reportClientError(new Error("Auth provider unconfigured"), {
        hint: "Check Keycloak and session env vars",
      });
    }
  }, [auth.status]);

  const sessionExpired =
    platform.isError &&
    /session expired|not authenticated/i.test(platform.error?.message ?? "");

  useEffect(() => {
    if (!sessionExpired) return;
    // BFF still has a cookie, but the API rejected the access token — re-auth.
    void auth.login();
  }, [sessionExpired, auth]);

  useEffect(() => {
    if (!platform.isError || sessionExpired) return;
    if (process.env.NODE_ENV !== "development") return;
    reportClientError(platform.error ?? new Error("Platform boot failed"), {
      source: "AuthGate",
    });
  }, [platform.isError, platform.error, sessionExpired]);

  if (auth.status === "loading") {
    return <BootSkeleton />;
  }

  if (auth.status === "unconfigured") {
    return (
      <SignInScreen
        title={t(locale, "auth.unavailableTitle")}
        description={t(locale, "auth.unavailableDescription")}
        footnote={t(locale, "auth.contactAdmin")}
      />
    );
  }

  if (auth.status === "anonymous" || sessionExpired) {
    return (
      <SignInScreen
        alert={authAlert}
        onLogin={() => auth.login()}
      />
    );
  }

  if (platform.isLoading) {
    return <BootSkeleton />;
  }

  if (platform.isError) {
    return (
      <SignInScreen
        title={t(locale, "auth.workspaceErrorTitle")}
        description={
          platform.error?.message
            ? `${t(locale, "auth.workspaceErrorDescription")} (${platform.error.message})`
            : t(locale, "auth.workspaceErrorDescription")
        }
        action={
          <Button
            className="signin-dark__login w-full"
            size="lg"
            onClick={() => void platform.refetch()}
          >
            {t(locale, "common.retry")}
          </Button>
        }
      />
    );
  }

  if (
    platform.organizations.length > 1 &&
    !platform.context?.organizationId
  ) {
    return (
      <SignInScreen
        title={t(locale, "auth.selectOrgTitle")}
        description={t(locale, "auth.selectOrgDescription")}
        action={<OrgSwitcher />}
      />
    );
  }

  return <ShellChrome>{children}</ShellChrome>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<BootSkeleton />}>
      <AuthGateInner>{children}</AuthGateInner>
    </Suspense>
  );
}
