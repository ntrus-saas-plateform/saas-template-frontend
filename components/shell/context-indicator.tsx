"use client";

import { usePlatform } from "@/providers/platform-provider";
import { useAppContext } from "@/shell/context/app-context";

/**
 * Human-readable workspace context. Never surfaces raw tenant UUIDs in the UI.
 * Technical ids remain available via the title tooltip for support.
 */
export function ContextIndicator() {
  const { context, organizations } = usePlatform();
  const { currentApp } = useAppContext();
  const org =
    organizations.find((o) => o.id === context?.organizationId) ??
    organizations[0];

  const orgLabel = org?.name ?? "Organization";
  const supportTitle = [
    orgLabel,
    org?.slug ? `slug=${org.slug}` : null,
    context?.organizationId ? `org=${context.organizationId}` : null,
    context?.tenantId ? `tenant=${context.tenantId}` : null,
    currentApp.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <p
      className="truncate text-xs text-[var(--text-muted)]"
      title={supportTitle}
    >
      <span className="text-[var(--text-secondary)]">{orgLabel}</span>
      <span className="mx-1 opacity-40">/</span>
      <span className="font-medium text-[var(--text-primary)]">
        {currentApp.name}
      </span>
    </p>
  );
}
