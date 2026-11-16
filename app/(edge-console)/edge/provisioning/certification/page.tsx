import type { Metadata } from "next";
import { EdgeCertificationModule } from "@/components/edge/certification/edge-certification-module";

export const metadata: Metadata = {
  title: "Production Certification | Edge Console",
};

/**
 * Edge Admin Console — Production Certification & Evidence Pack (P7.15).
 * Fail-closed certify; revoke clears CERTIFIED. Migration 111.
 */
export default function EdgeCertificationPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-certification-page">
      <header className="space-y-1">
        <h1 className="type-xl font-semibold tracking-tight">
          Production Certification
        </h1>
        <p className="type-sm text-[var(--text-muted)]">
          Evidence pack assemble / certify / revoke via P7.4. Cannot CERTIFY if
          required evidence is MISSING or FAILED. Revoke clears CERTIFIED.
          p714_agents optional for Shared SaaS. Migration 111.
        </p>
      </header>
      <EdgeCertificationModule />
    </div>
  );
}
