import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statut | Okapi Trust",
  description: "Statut d'exploitation Okapi",
};

export default function TrustStatusPage() {
  return (
    <article className="space-y-6 rounded-none bg-[var(--bg-surface)] p-8 shadow-[0_20px_60px_rgba(15,28,46,0.12)]">
      <h1 className="text-3xl font-semibold tracking-tight">Statut</h1>
      <p className="text-[var(--text-muted)]">
        Page statut beachhead. Les indicateurs live (ready, cash-truth, drift)
        proviennent des APIs Edge — jamais de totaux inventés ici.
      </p>
      <div className="border border-[var(--border)] p-4 type-sm">
        <p>
          <strong>Posture :</strong> TECHNICAL PRODUCTION READY (beachhead
          Syntix + Restaurant) — voir certification Edge rgom-alignment.
        </p>
        <p className="mt-2 text-[var(--text-muted)]">
          Trafic marketing payant : après sign-offs Legal/Security wet-ink.
        </p>
      </div>
    </article>
  );
}
