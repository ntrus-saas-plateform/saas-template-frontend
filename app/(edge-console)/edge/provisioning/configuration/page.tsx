import type { Metadata } from "next";
import { EdgeConfigurationModule } from "@/components/edge/configuration/edge-configuration-module";

export const metadata: Metadata = {
  title: "Configuration & Entitlements | Edge Console",
  description:
    "Registry de configuration, assignations tenant et déploiement d'entitlements (P7.8)",
};

/**
 * Edge Admin Console — Configuration & Entitlement Deployment (P7.8).
 *
 * Schemas, templates, bundles, tenant assignments, deploy/rollback via P7.4.
 * Secrets remain vault-referenced; console never displays plaintext secrets.
 */
export default function EdgeConfigurationPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-configuration-page">
      <div>
        <h1 className="text-2xl font-semibold">Configuration & Entitlements</h1>
        <p className="text-sm text-muted-foreground">
          Registry versionné (schemas, templates, bundles), assignation tenant et
          déploiement d&apos;entitlements P5 via workflows P7.4 — aucune expansion
          de droits, secrets uniquement via références Vault.
        </p>
      </div>
      <EdgeConfigurationModule />
    </div>
  );
}
