import Link from "next/link";
import type { Metadata } from "next";
import { AcquirePortalClient } from "./portal-client";

export const metadata: Metadata = {
  title: "Okapi — Portail client",
  description: "Portail prospect Okapi (authentification plateforme requise)",
};

type Props = {
  searchParams: Promise<{ prospectId?: string; session?: string }>;
};

export default async function AcquirePortalPage({ searchParams }: Props) {
  const { prospectId, session } = await searchParams;

  return (
    <div className="space-y-8" data-testid="acquire-portal">
      <section className="space-y-3 text-white">
        <p
          className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </p>
        <h1 className="text-[clamp(1.25rem,3vw,1.75rem)] font-medium text-white/90">
          Portail client
        </h1>
        <p className="max-w-xl type-sm text-white/70">
          Suivi candidature, documents et checkout. L&apos;agrégat portail admin
          (`customer-portal`) exige une session Edge avec{" "}
          <code className="text-white/90">platform:acquisition:read</code> — ce
          shell public ne simule pas d&apos;authentification.
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4">
        <AcquirePortalClient prospectId={prospectId} sessionId={session} />

        <ul className="list-disc space-y-2 pl-5 type-sm text-[var(--text-secondary)]">
          <li>Candidatures et documents — via endpoints authentifiés</li>
          <li>Sessions checkout — revue sans champs carte</li>
          <li>
            Handoff abonnement — jamais marqué « provisionné » depuis
            l&apos;acquisition seule
          </li>
        </ul>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/edge"
            className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-4 type-sm font-medium text-[var(--on-primary)]"
          >
            Connexion Edge
          </Link>
          <Link
            href="/acquire"
            className="inline-flex h-[var(--control-height)] items-center border border-[var(--border)] px-4 type-sm"
          >
            Catalogue
          </Link>
        </div>
      </section>
    </div>
  );
}
