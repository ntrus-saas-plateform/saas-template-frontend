import type { Metadata } from "next";
import { EdgeReconciliationModule } from "@/components/edge/reconciliation/edge-reconciliation-module";

export const metadata: Metadata = {
  title: "Reconciliation & Governance | Edge Console",
};

/**
 * Edge Admin Console — Reconciliation & Operational Governance (P7.13).
 * Drift detection, waivers, remediations via P7.4 — unreachable ⇒ UNKNOWN.
 */
export default function EdgeReconciliationPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-reconciliation-page">
      <header className="space-y-1">
        <h1 className="type-xl font-semibold tracking-tight">
          Reconciliation & Operational Governance
        </h1>
        <p className="type-sm text-[var(--text-muted)]">
          Drift / missing / unexpected / UNKNOWN. Timeout ≠ deleted. Auto-remediate
          seulement si eligible + policy + reversible — sinon approbation. Pas de
          suppressions aveugles. Migration 109 (108 = P8).
        </p>
      </header>
      <EdgeReconciliationModule />
    </div>
  );
}
