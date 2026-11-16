import type { Metadata } from "next";
import { EdgeCertificationModule } from "@/components/edge/certification/edge-certification-module";

export const metadata: Metadata = {
  title: "Evidence Viewer | Edge Console",
};

/**
 * Cross-cutting Evidence viewer (P7.15) — lists certification packages + links.
 * Thin wrapper over the certification module evidence tab.
 */
export default function EdgeEvidenceViewerPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-evidence-page">
      <header className="space-y-1">
        <h1 className="type-xl font-semibold tracking-tight">Evidence Viewer</h1>
        <p className="type-sm text-[var(--text-muted)]">
          Vue transversale des packages de certification et références d&apos;evidence
          (P7.15). Ne déclare pas ACCEPTED — READY FOR AUDIT uniquement.
        </p>
      </header>
      <EdgeCertificationModule initialTab="evidence" />
    </div>
  );
}
