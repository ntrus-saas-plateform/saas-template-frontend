import type { Metadata } from "next";
import { EdgeLifecycleModule } from "@/components/edge/lifecycle/edge-lifecycle-module";

export const metadata: Metadata = {
  title: "Tenant Technical Lifecycle | Edge Console",
  description:
    "Suspend / resume / deprovision technique des tenants (P7.11)",
};

/**
 * Edge Admin Console — Tenant Technical Lifecycle (P7.11).
 *
 * Post-activation suspend / resume / deprovision via P7.4 workflows.
 * Never silent delete; does not set commercial Subscription status alone.
 */
export default function EdgeTenantLifecyclePage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-lifecycle-page">
      <div>
        <h1 className="text-2xl font-semibold">
          Tenant Technical Lifecycle
        </h1>
        <p className="text-sm text-muted-foreground">
          Lifecycle technique post-activation : suspend, resume, deprovision
          via workflows P7.4 — jamais de suppression silencieuse, ne gère pas
          l&apos;IAM métier ni le statut commercial.
        </p>
      </div>
      <EdgeLifecycleModule />
    </div>
  );
}
