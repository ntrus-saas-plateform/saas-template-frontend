"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EdgeEmptyState } from "@/components/edge/states";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeWorkspaceOverviewPage() {
  const { activeWorkspace, activeVerticalId, workspaces } = useEdgePlatform();
  const vertical =
    activeWorkspace?.vertical ??
    workspaces.find((w) => w.vertical.id === activeVerticalId)?.vertical;

  if (!vertical) {
    return (
      <EdgeEmptyState
        title="No active workspace"
        description="Select a workspace from the switcher to open configuration and administration."
      />
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      <header className="space-y-[var(--space-1)]">
        <p className="type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Active workspace
        </p>
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          {vertical.name ?? vertical.code ?? vertical.id}
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          {[vertical.code, vertical.status].filter(Boolean).join(" · ")}
        </p>
      </header>

      <div className="flex flex-wrap gap-[var(--space-2)]">
        <Button asChild>
          <Link href="/edge/workspace/configuration">Configuration</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/edge/workspace/administration">Administration</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/edge/security">Security</Link>
        </Button>
      </div>
    </div>
  );
}
