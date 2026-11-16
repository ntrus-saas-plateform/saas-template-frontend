import type { Metadata } from "next";
import { EdgeOnboardingModule } from "@/components/edge/onboarding/edge-onboarding-module";

export const metadata: Metadata = {
  title: "Onboarding Operations | Edge Console",
};

/**
 * Edge Admin Console — Onboarding Operations (P7.12).
 * Post-activation operational journeys — not CRM / not business invites.
 */
export default function EdgeOnboardingOperationsPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-onboarding-page">
      <header className="space-y-1">
        <h1 className="type-xl font-semibold tracking-tight">
          Onboarding Operations
        </h1>
        <p className="type-sm text-[var(--text-muted)]">
          Parcours opérationnels post-activation : templates, steps, tâches
          humaines — workflows P7.4, fail-closed P7.1. Pas de CRM ni
          Subscription.ACTIVE.
        </p>
      </header>
      <EdgeOnboardingModule />
    </div>
  );
}
