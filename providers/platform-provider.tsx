"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "@/lib/api/client";
import { platformApi } from "@/lib/api/platform";
import { isBffAuthMode } from "@/lib/auth/mode";
import { useAuth } from "@/providers/auth-provider";
import type {
  CapabilitiesSnapshot,
  PlatformContext,
  PlatformOrganization,
} from "@/types/platform";

type PlatformState = {
  context: PlatformContext | null;
  capabilities: CapabilitiesSnapshot | null;
  organizations: PlatformOrganization[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  apiBaseReady: boolean;
};

const PlatformCtx = createContext<PlatformState | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const authenticated = auth.status === "authenticated";
  const bff = isBffAuthMode();

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: bff ? "" : undefined,
        getAccessToken: () => auth.getAccessToken(),
        onUnauthorized: () => {
          void auth.login();
        },
      }),
    [auth, bff],
  );

  const api = useMemo(() => platformApi(client), [client]);

  const bootQuery = useQuery({
    queryKey: ["platform", "boot", bff ? "bff" : "spa"],
    enabled: authenticated,
    queryFn: async () => {
      if (bff) {
        const res = await fetch("/api/bootstrap", { credentials: "include" });
        const json = (await res.json().catch(() => null)) as {
          data?: {
            context: PlatformContext;
            capabilities: CapabilitiesSnapshot;
            organizations?: PlatformOrganization[];
          };
          error?: { message?: string; code?: string };
        } | null;
        if (!res.ok) {
          throw new Error(
            json?.error?.message ??
              `Bootstrap failed (${res.status})`,
          );
        }
        if (!json?.data?.context || !json.data.capabilities) {
          throw new Error("Bootstrap returned an incomplete payload");
        }
        return {
          context: json.data.context,
          capabilities: json.data.capabilities,
          organizations: json.data.organizations ?? [],
        };
      }
      const [contextRes, capsRes, orgsRes] = await Promise.all([
        api.getContext(),
        api.getCapabilities(),
        api.listOrganizations(),
      ]);
      return {
        context: contextRes.data,
        capabilities: capsRes.data,
        organizations: orgsRes.data ?? [],
      };
    },
    staleTime: 30_000,
  });

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      const boot = bootQuery.data;
      const orgs = boot?.organizations ?? [];
      const previous =
        orgs.find((o) => o.id === boot?.context?.organizationId)?.name ??
        boot?.context?.organizationId ??
        "previous";
      const next =
        orgs.find((o) => o.id === organizationId)?.name ?? organizationId;
      await api.switchOrganization(organizationId);
      if (!bff) {
        await auth.refreshToken();
      }
      const { pushActivity } = await import(
        "@/components/shell/activity-center"
      );
      pushActivity("Organization switched", `${previous} → ${next}`);
      await queryClient.invalidateQueries({ queryKey: ["platform"] });
      await queryClient.invalidateQueries({ queryKey: ["org"] });
      await queryClient.invalidateQueries({ queryKey: ["identity"] });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["org"] });
      await queryClient.invalidateQueries({ queryKey: ["pharmacy"] });
    },
    [api, auth, bff, bootQuery.data, queryClient],
  );

  const refetch = useCallback(async () => {
    await bootQuery.refetch();
  }, [bootQuery]);

  // Soft capability refresh on window focus (P7)
  useEffect(() => {
    if (!authenticated) return;
    const onFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "boot"] });
    };
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(onFocus, 5 * 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [authenticated, queryClient]);

  // Record login once per browser session (deduped server-side by JWT jti)
  useEffect(() => {
    if (!authenticated || !bootQuery.isSuccess) return;
    const key = "edge.loginRecorded";
    if (sessionStorage.getItem(key) === "1") return;
    void (async () => {
      try {
        const { identityApi } = await import("@/lib/api/identity");
        const res = await identityApi(client).users.loginHistory.record({
          eventType: "login",
          success: true,
        });
        sessionStorage.setItem(key, "1");
        if (res.data?.created) {
          const { pushActivity } = await import(
            "@/components/shell/activity-center"
          );
          pushActivity("Signed in", "Session recorded");
        }
      } catch {
        // non-blocking
      }
    })();
  }, [authenticated, bootQuery.isSuccess, client]);

  const bootError: Error | null = bootQuery.isError
    ? bootQuery.error instanceof Error
      ? bootQuery.error
      : new Error("Platform boot failed")
    : null;

  const value: PlatformState = {
    context: bootQuery.data?.context ?? null,
    capabilities: bootQuery.data?.capabilities ?? null,
    organizations: bootQuery.data?.organizations ?? [],
    isLoading: authenticated && bootQuery.isLoading,
    isError: bootQuery.isError,
    error: bootError,
    refetch,
    switchOrganization,
    apiBaseReady: authenticated,
  };

  return (
    <PlatformCtx.Provider value={value}>{children}</PlatformCtx.Provider>
  );
}

export function usePlatform(): PlatformState {
  const ctx = useContext(PlatformCtx);
  if (!ctx) {
    throw new Error("usePlatform must be used within PlatformProvider");
  }
  return ctx;
}

export function useApiClient() {
  const auth = useAuth();
  const bff = isBffAuthMode();
  return useMemo(
    () =>
      createApiClient({
        baseUrl: bff ? "" : undefined,
        getAccessToken: () => auth.getAccessToken(),
        onUnauthorized: () => {
          void auth.login();
        },
      }),
    [auth, bff],
  );
}
