import type { Metadata } from "next";
import { EdgeExperienceModule } from "@/components/edge/experience/edge-experience-module";

export const metadata: Metadata = {
  title: "Product Experience | Edge Console",
  description:
    "Profils d'expérience, applications, assignations tenant et domaines (P7.9)",
};

/**
 * Edge Admin Console — Product Experience Provisioning (P7.9).
 *
 * Profiles, applications, tenant assignments, domains, provision/deactivate via P7.4.
 * Secrets remain vault-referenced; console never displays plaintext secrets.
 */
export default function EdgeExperiencePage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-experience-page">
      <div>
        <h1 className="text-2xl font-semibold">Product Experience</h1>
        <p className="text-sm text-muted-foreground">
          Profils et applications versionnés, assignation tenant, binding de
          domaines et provisionnement via workflows P7.4 — aucune expansion de
          droits, secrets uniquement via références Vault.
        </p>
      </div>
      <EdgeExperienceModule />
    </div>
  );
}
