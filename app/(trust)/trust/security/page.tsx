import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurité | Okapi Trust",
  description: "Posture sécurité Okapi Edge / Business Backend",
};

export default function TrustSecurityPage() {
  return (
    <article className="space-y-6 rounded-none bg-[var(--bg-surface)] p-8 shadow-[0_20px_60px_rgba(15,28,46,0.12)]">
      <h1 className="text-3xl font-semibold tracking-tight">Sécurité</h1>
      <p className="text-[var(--text-muted)]">
        Isolation tenant/org, M2M Edge→BB fail-closed, RBAC console, secrets hors
        git, adapters lab interdits en production.
      </p>
      <ul className="list-disc space-y-2 pl-5 type-sm">
        <li>Entitlements projetés Edge — jamais vides en staging/prod</li>
        <li>Paiements orchestrés PSP — pas de PAN/CVV stockés Edge</li>
        <li>ModuleGuard authoritative en production BB</li>
        <li>Audit trail mutations sensibles</li>
      </ul>
    </article>
  );
}
