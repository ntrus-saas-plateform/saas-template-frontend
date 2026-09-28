"use client";

import { useEffect } from "react";
import { identityApi } from "@/lib/api/identity";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

/** Apply tenant branding CSS vars from settings namespace `branding` when readable. */
export function TenantBrandingHooks() {
  const client = useApiClient();
  const { context, capabilities } = usePlatform();
  const tenantId = context?.tenantId;
  const canRead = (capabilities?.permissions ?? context?.permissions ?? []).some(
    (p) => p === "settings:read" || p === "*" || p.endsWith(":*"),
  );

  useEffect(() => {
    if (!tenantId || !canRead) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await identityApi(client).settings.getTenantNs("branding");
        if (cancelled) return;
        const payload = res.data as { values?: Record<string, unknown> } | Record<string, unknown>;
        const data =
          payload && typeof payload === "object" && "values" in payload
            ? ((payload.values ?? {}) as Record<string, unknown>)
            : ((payload ?? {}) as Record<string, unknown>);
        const root = document.documentElement;
        // Logo only — do not override Softcount primary/accent colors.
        if (typeof data.logoUrl === "string") {
          root.dataset.brandLogo = data.logoUrl;
        }
      } catch {
        /* branding optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, tenantId, canRead]);

  return null;
}
