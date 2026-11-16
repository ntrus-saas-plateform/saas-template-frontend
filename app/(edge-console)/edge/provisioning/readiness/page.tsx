import type { Metadata } from "next";
import { EdgeActivationModule } from "@/components/edge/activation/edge-activation-module";

export const metadata: Metadata = {
  title: "Technical Readiness & Activation | Edge Console",
  description:
    "Évaluations de readiness technique, records d'activation et historique (P7.10)",
};

/**
 * Edge Admin Console — Technical Readiness & Activation (P7.10).
 *
 * Distinct from commercial readiness at /edge/readiness (P1).
 * Evaluate/activate only via P7.4 workflows; never fakes ACTIVE.
 */
export default function EdgeTechnicalReadinessPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-activation-page">
      <div>
        <h1 className="text-2xl font-semibold">
          Technical Readiness & Activation
        </h1>
        <p className="text-sm text-muted-foreground">
          Gate d&apos;activation technique : évaluations de readiness, records
          liés à P7.1, evaluate/activate via workflows P7.4 — n&apos;active
          pas l&apos;abonnement commercial.
        </p>
      </div>
      <EdgeActivationModule />
    </div>
  );
}
