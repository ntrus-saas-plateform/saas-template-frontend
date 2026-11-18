import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Okapi Trust",
  description: "Support clients Okapi beachhead",
};

export default function TrustSupportPage() {
  return (
    <article className="space-y-6 rounded-none bg-[var(--bg-surface)] p-8 shadow-[0_20px_60px_rgba(15,28,46,0.12)]">
      <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
      <p className="text-[var(--text-muted)]">
        Canaux beachhead : console Edge (CS / onboarding), portail acquisition,
        escalade dunning/billing via runbooks ops.
      </p>
      <ul className="list-disc space-y-2 pl-5 type-sm">
        <li>Incidents billing / dunning — runbook 19</li>
        <li>Drift entitlements — drift-scan + republish</li>
        <li>Demandes privacy — procédure DPA beachhead</li>
      </ul>
    </article>
  );
}
