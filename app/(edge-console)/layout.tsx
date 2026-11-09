"use client";

import type { ReactNode } from "react";
import { EdgeAuthGate } from "@/components/edge/edge-auth-gate";
import { EdgeShell } from "@/components/edge/edge-shell";
import { EdgePlatformProvider } from "@/providers/edge-platform-provider";
import { EdgeSessionProvider } from "@/providers/edge-session-provider";

/**
 * Isolated Edge Admin Console shell.
 * Must not use ERP AuthGate or OrgSwitcher.
 */
export default function EdgeConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <EdgeSessionProvider>
      <EdgePlatformProvider>
        <EdgeAuthGate>
          <EdgeShell>{children}</EdgeShell>
        </EdgeAuthGate>
      </EdgePlatformProvider>
    </EdgeSessionProvider>
  );
}
