import type { Metadata } from "next";
import { EdgeAgentsModule } from "@/components/edge/agents/edge-agents-module";

export const metadata: Metadata = {
  title: "Connectivity Agents | Edge Console",
};

/**
 * Edge Admin Console — Connectivity Agent Registry (P7.14).
 * Outbound-only agents for Private Cloud / On-Prem. Not required for Shared SaaS.
 */
export default function EdgeConnectivityAgentsPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-agents-page">
      <header className="space-y-1">
        <h1 className="type-xl font-semibold tracking-tight">
          Connectivity Agents
        </h1>
        <p className="type-sm text-[var(--text-muted)]">
          Registre d&apos;agents outbound-only. Clés vault uniquement. Commandes
          signées + nonce anti-replay. Révocation fail-closed. Migration 110.
        </p>
      </header>
      <EdgeAgentsModule />
    </div>
  );
}
