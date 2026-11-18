import Link from "next/link";
import type { Metadata } from "next";
import { AcquirePlanCheckout } from "@/components/acquisition/acquire-plan-checkout";
import { publicAcquisitionFetch } from "@/lib/edge/public-acquisition-fetch";
import type { PlanPresentation, PublicProductPage } from "@/types/edge-acquisition";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Okapi — Configurer ${slug}`,
    description: "Choisir un plan publié et postuler ou payer (SMB configure)",
  };
}

async function loadProduct(slug: string): Promise<{
  page: PublicProductPage | null;
  plans: PlanPresentation[];
  error: string | null;
}> {
  try {
    const res = await publicAcquisitionFetch(`products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return { page: null, plans: [], error: `Produit indisponible (${res.status})` };
    }
    const json = (await res.json()) as { data?: PublicProductPage } & PublicProductPage;
    const page = (json.data ?? json) as PublicProductPage;
    if (!page?.presentation) {
      return { page: null, plans: [], error: "Payload produit incomplet" };
    }

    const plansRes = await publicAcquisitionFetch(
      `plans?productPresentationId=${encodeURIComponent(page.presentation.id)}&limit=50`,
      { next: { revalidate: 30 } },
    );
    let plans: PlanPresentation[] = [];
    if (plansRes.ok) {
      const plansJson = (await plansRes.json()) as {
        data?: { items?: PlanPresentation[] } | PlanPresentation[];
        items?: PlanPresentation[];
      };
      const data = plansJson.data ?? plansJson;
      if (Array.isArray(data)) plans = data;
      else if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
        plans = data.items;
      }
    }

    return { page, plans, error: null };
  } catch (e) {
    return {
      page: null,
      plans: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

function applyHref(
  slug: string,
  defaultFormSlug: string | null | undefined,
  plan: PlanPresentation,
): string {
  const base = `/acquire/${encodeURIComponent(slug)}/apply`;
  const qs = new URLSearchParams();
  if (defaultFormSlug?.trim()) qs.set("form", defaultFormSlug.trim());
  qs.set("planPresentationId", plan.id);
  if (plan.commercialPlanId) qs.set("commercialPlanId", plan.commercialPlanId);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export default async function AcquireConfigurePage({ params }: Props) {
  const { slug } = await params;
  const { page, plans, error } = await loadProduct(slug);

  if (error || !page) {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-8"
        data-testid="acquire-configure"
      >
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Configuration
        </h1>
        <p className="mt-3 type-sm text-[var(--danger)]">{error ?? "Produit introuvable"}</p>
        <Link href="/acquire" className="mt-6 inline-block type-sm text-[var(--primary)]">
          ← Catalogue
        </Link>
      </div>
    );
  }

  const { presentation } = page;
  const defaultFormSlug = page.defaultFormSlug;

  return (
    <div className="space-y-8" data-testid="acquire-configure">
      <section className="space-y-2 text-white">
        <p
          className="text-sm uppercase tracking-[0.2em] text-white/60"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </p>
        <h1 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold">Configurer</h1>
        <p className="max-w-xl type-sm text-white/70">
          {presentation.title} — plans publiés uniquement (BFF{" "}
          <code className="text-white/90">publicAcquisitionFetch</code>). Pas de données inventées.
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        {plans.length === 0 ? (
          <p className="type-sm text-[var(--text-muted)]">Aucun plan publié pour ce produit.</p>
        ) : (
          <ul className="space-y-5">
            {plans.map((plan) => {
              const published = String(plan.status).toUpperCase() === "PUBLISHED";
              return (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5 last:border-0"
                >
                  <div className="min-w-[12rem] flex-1">
                    <p className="font-medium">{plan.title}</p>
                    {plan.summary ? (
                      <p className="mt-1 type-sm text-[var(--text-secondary)]">{plan.summary}</p>
                    ) : null}
                    <p className="mt-2 type-xs text-[var(--text-muted)]">
                      {plan.priceDisplayMode}
                      {plan.priceDisplayRef ? ` · ${plan.priceDisplayRef}` : ""}
                      {plan.currencyHint ? ` · ${plan.currencyHint}` : ""}
                      {!published ? " · non PUBLISHED" : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={applyHref(slug, defaultFormSlug, plan)}
                      className="inline-flex h-[var(--control-height)] items-center justify-center bg-[var(--primary)] px-4 type-sm font-medium text-[var(--on-primary)]"
                    >
                      Postuler / candidature
                    </Link>
                    {published ? (
                      <AcquirePlanCheckout
                        planPresentationId={plan.id}
                        planTitle={plan.title}
                        ctaLabel={plan.ctaLabel ?? "Checkout"}
                      />
                    ) : (
                      <span className="type-xs text-[var(--text-muted)]">
                        Checkout indisponible (plan non publié)
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/acquire/${encodeURIComponent(slug)}`}
            className="inline-flex h-[var(--control-height)] items-center border border-[var(--border)] px-4 type-sm text-[var(--text-secondary)]"
          >
            ← Présentation produit
          </Link>
          <Link href="/acquire" className="type-sm text-[var(--primary)]">
            Catalogue
          </Link>
        </div>
      </section>
    </div>
  );
}