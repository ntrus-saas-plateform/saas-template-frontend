"use client";

import { useEffect, useState } from "react";
import { edgeApi } from "@/lib/api/edge";
import type { CustomerPortalSnapshot } from "@/types/edge-acquisition";

type Props = {
  prospectId?: string;
  sessionId?: string;
};

function unwrapData<T>(data: unknown): T | null {
  if (!data) return null;
  if (typeof data === "object" && data !== null && "data" in data) {
    return ((data as { data: T }).data ?? null) as T | null;
  }
  return data as T;
}

export function AcquirePortalClient({ prospectId, sessionId }: Props) {
  const [authState, setAuthState] = useState<
    "checking" | "anonymous" | "authenticated"
  >("checking");
  const [portal, setPortal] = useState<CustomerPortalSnapshot | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionRes = await edgeApi.session();
        const authenticated = Boolean(sessionRes.data?.authenticated);
        if (cancelled) return;
        setAuthState(authenticated ? "authenticated" : "anonymous");

        if (authenticated && prospectId?.trim()) {
          try {
            const res = await edgeApi.getAcquisitionCustomerPortal(
              prospectId.trim(),
            );
            if (cancelled) return;
            setPortal(unwrapData<CustomerPortalSnapshot>(res));
            setPortalError(null);
          } catch (e) {
            if (cancelled) return;
            setPortal(null);
            setPortalError(
              e instanceof Error ? e.message : "Snapshot portail indisponible",
            );
          }
        }
      } catch {
        if (!cancelled) setAuthState("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prospectId]);

  useEffect(() => {
    const id = sessionId?.trim();
    if (!id) {
      setCheckoutStatus(null);
      setCheckoutNote(null);
      setCheckoutError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await edgeApi.getPublicAcquisitionCheckout(id);
        if (cancelled) return;
        const data = res.data;
        setCheckoutStatus(data?.status ?? null);
        setCheckoutNote(data?.note ?? null);
        setCheckoutError(data ? null : "Réponse checkout vide");
      } catch (e) {
        if (cancelled) return;
        setCheckoutStatus(null);
        setCheckoutNote(null);
        setCheckoutError(
          e instanceof Error ? e.message : "Checkout public indisponible",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="space-y-4" data-testid="acquire-portal-client">
      {authState === "checking" ? (
        <p className="type-sm text-[var(--text-muted)]">
          Vérification de session…
        </p>
      ) : null}

      {prospectId ? (
        <p className="type-sm text-[var(--text-secondary)]">
          prospectId fourni : <code>{prospectId}</code>.
          {authState === "anonymous" ? (
            <>
              {" "}
              Aucune session Edge détectée — connectez-vous à la console pour
              charger le snapshot réel. Aucun statut de provisioning n&apos;est
              inventé ici.
            </>
          ) : null}
          {authState === "authenticated" && !portal && !portalError ? (
            <> Chargement du snapshot authentifié…</>
          ) : null}
        </p>
      ) : (
        <p className="type-sm text-[var(--text-muted)]">
          Ajoutez <code>?prospectId=&lt;uuid&gt;</code> pour contextualiser ce
          shell. Le contenu métier reste derrière l&apos;auth plateforme.
        </p>
      )}

      {portalError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          Snapshot portail : {portalError}
        </p>
      ) : null}

      {portal ? (
        <dl
          className="grid gap-3 type-sm md:grid-cols-2"
          data-testid="acquire-portal-snapshot"
        >
          <div>
            <dt className="text-[var(--text-muted)]">Prospect</dt>
            <dd>{portal.prospect?.emailNormalized ?? portal.prospect?.id}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Applications</dt>
            <dd>{portal.applications?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Checkouts</dt>
            <dd>{portal.checkoutSessions?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Handoffs</dt>
            <dd>{portal.subscriptionHandoffs?.length ?? 0}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-[var(--text-muted)]">Provisioning</dt>
            <dd>
              {portal.provisioningComplete
                ? "Marqué complete par l’API"
                : "Non complete (honnête — pas inventé)"}
              {portal.note ? ` — ${portal.note}` : null}
            </dd>
          </div>
        </dl>
      ) : null}

      {sessionId ? (
        <div
          className="space-y-2 border-t border-[var(--border)] pt-4"
          data-testid="acquire-portal-checkout"
        >
          <p className="type-sm text-[var(--text-secondary)]">
            Session checkout publique : <code>{sessionId}</code>
          </p>
          {checkoutError ? (
            <p className="type-sm text-[var(--danger)]" role="alert">
              {checkoutError}
            </p>
          ) : (
            <p className="type-sm">
              Statut : <strong>{checkoutStatus ?? "Chargement…"}</strong>
              {checkoutNote ? ` — ${checkoutNote}` : null}
            </p>
          )}
          <p className="type-xs text-[var(--text-muted)]">
            Projection publique sans champs carte. Vérité paiement = P6.
          </p>
        </div>
      ) : null}
    </div>
  );
}
