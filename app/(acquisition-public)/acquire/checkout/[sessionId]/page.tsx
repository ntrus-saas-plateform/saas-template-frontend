"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { edgeApi } from "@/lib/api/edge";

type Props = { params: Promise<{ sessionId: string }> };

/**
 * Public checkout review — no card fields.
 * Loads status via GET /acquisition/public/checkout/:id.
 */
export default function AcquireCheckoutPage({ params }: Props) {
  const { sessionId } = use(params);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await edgeApi.getPublicAcquisitionCheckout(sessionId);
        if (cancelled) return;
        const data = res.data;
        setStatus(data?.status ?? null);
        setNote(data?.note ?? null);
        setError(data ? null : "Réponse checkout vide");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Statut indisponible");
        setStatus(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="space-y-8" data-testid="acquire-checkout">
      <section className="space-y-3 text-white">
        <p
          className="text-sm uppercase tracking-[0.2em] text-white/60"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </p>
        <h1 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold">
          Revue checkout
        </h1>
        <p className="max-w-xl type-sm text-white/70">
          Aucun champ carte sur cette page. Le paiement passe par des références
          billing (P6), jamais par des credentials saisis ici.
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4">
        <dl className="grid gap-3 type-sm md:grid-cols-2">
          <div>
            <dt className="text-[var(--text-muted)]">Session</dt>
            <dd className="font-mono break-all">{sessionId}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Statut</dt>
            <dd data-testid="acquire-checkout-status">
              {loading ? "Chargement…" : error ? `Erreur — ${error}` : status ?? "Inconnu"}
            </dd>
          </div>
        </dl>

        {note ? (
          <p className="type-sm text-[var(--text-secondary)]">{note}</p>
        ) : (
          <p className="type-sm text-[var(--text-secondary)]">
            Le statut affiché est une projection d&apos;orchestration P10. La vérité
            paiement reste P6 ; aucun « payé » ou « provisionné » inventé.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/acquire/portal"
            className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-4 type-sm font-medium text-[var(--on-primary)]"
          >
            Portail client
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
