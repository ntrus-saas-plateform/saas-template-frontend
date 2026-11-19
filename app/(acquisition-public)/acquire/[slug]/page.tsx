import Link from "next/link";
import type { Metadata } from "next";
import { AcquirePlanCheckout } from "@/components/acquisition/acquire-plan-checkout";
import { buildAcquireApplyHref } from "@/lib/edge/public-acquisition-client";
import { publicAcquisitionFetch } from "@/lib/edge/public-acquisition-fetch";
import type {
  PlanPresentation,
  PublicProductPage,
} from "@/types/edge-acquisition";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Okapi — ${slug}`,
    description: "Présentation produit Okapi",
  };
}

function featureKeyOf(entry: unknown): string | null {
  if (typeof entry === "string" && entry.trim()) return entry.trim();
  if (entry && typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    for (const k of ["key", "label", "name", "code"] as const) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) {
        return (o[k] as string).trim();
      }
    }
  }
  return null;
}

function featureCell(plan: PlanPresentation, key: string): string {
  for (const entry of plan.featuresDisplay ?? []) {
    if (typeof entry === "string") {
      if (entry.trim() === key) return "Oui";
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const entryKey = featureKeyOf(entry);
    if (entryKey !== key) continue;
    if (typeof o.value === "boolean") return o.value ? "Oui" : "Non";
    if (typeof o.enabled === "boolean") return o.enabled ? "Oui" : "Non";
    if (o.value != null && String(o.value).trim()) return String(o.value);
    if (o.included != null) return String(o.included);
    return "Oui";
  }
  return "—";
}

function collectFeatureKeys(plans: PlanPresentation[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const plan of plans) {
    for (const entry of plan.featuresDisplay ?? []) {
      const key = featureKeyOf(entry);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

async function loadProduct(slug: string): Promise<{
  page: PublicProductPage | null;
  plans: PlanPresentation[];
  error: string | null;
}> {
  try {
    const res = await publicAcquisitionFetch(
      `products/${encodeURIComponent(slug)}`,
      { next: { revalidate: 30 } },
    );
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

export default async function AcquireProductPage({ params }: Props) {
  const { slug } = await params;
  const { page, plans, error } = await loadProduct(slug);

  if (error || !page) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-8">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </h1>
        <p className="mt-3 type-sm text-[var(--danger)]">{error ?? "Produit introuvable"}</p>
        <Link href="/acquire" className="mt-6 inline-block type-sm text-[var(--primary)]">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  const { presentation } = page;
  const featureKeys = plans.length > 1 ? collectFeatureKeys(plans) : [];

  return (
    <div className="space-y-8" data-testid="acquire-product">
      <section className="space-y-3 text-white">
        <p
          className="text-sm uppercase tracking-[0.2em] text-white/60"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-tight">
          {presentation.title}
        </h1>
        {presentation.summary ? (
          <p className="max-w-2xl type-md text-white/75">{presentation.summary}</p>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h2 className="type-lg font-semibold">Plans</h2>
        {plans.length === 0 ? (
          <p className="mt-3 type-sm text-[var(--text-muted)]">
            Aucun plan publié pour cette présentation.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{plan.title}</p>
                  {plan.summary ? (
                    <p className="mt-1 type-sm text-[var(--text-secondary)]">{plan.summary}</p>
                  ) : null}
                  <p className="mt-2 type-xs text-[var(--text-muted)]">
                    {plan.priceDisplayMode}
                    {plan.priceDisplayRef ? ` · ref ${plan.priceDisplayRef}` : ""}
                    {plan.currencyHint ? ` · ${plan.currencyHint}` : ""}
                  </p>
                  <Link
                    href={buildAcquireApplyHref(slug, {
                      defaultFormSlug: page.defaultFormSlug,
                      planPresentationId: plan.id,
                      commercialPlanId: plan.commercialPlanId,
                    })}
                    className="mt-3 inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-4 type-sm font-medium text-[var(--on-primary)]"
                  >
                    {plan.ctaLabel?.trim() || "Postuler"}
                  </Link>
                  {String(plan.status).toUpperCase() === "PUBLISHED" ? (
                    <AcquirePlanCheckout
                      planPresentationId={plan.id}
                      planTitle={plan.title}
                      ctaLabel={plan.ctaLabel}
                    />
                  ) : (
                    <p className="mt-2 type-xs text-[var(--text-muted)]">
                      Checkout après PUBLISH (Legal + price MEASURED).
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {plans.length > 1 ? (
          <div className="mt-8 space-y-3" data-testid="acquire-plan-comparison">
            <h3 className="type-md font-semibold">Comparaison des plans</h3>
            <p className="type-xs text-[var(--text-muted)]">
              Prix affichés uniquement via priceDisplayMode / priceDisplayRef — aucun montant
              inventé.
            </p>
            {featureKeys.length === 0 ? (
              <p className="type-sm text-[var(--text-muted)]">
                Aucune caractéristique (featuresDisplay) publiée pour ces plans.
              </p>
            ) : (
              <div className="overflow-x-auto border border-[var(--border)]">
                <table className="w-full type-sm text-left">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Caractéristique</th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="px-3 py-2 font-medium">
                          {plan.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2 text-[var(--text-muted)]">Affichage prix</td>
                      {plans.map((plan) => (
                        <td key={`${plan.id}-price`} className="px-3 py-2">
                          {plan.priceDisplayMode}
                          {plan.priceDisplayRef ? (
                            <span className="block type-xs text-[var(--text-muted)]">
                              {plan.priceDisplayRef}
                            </span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                    {featureKeys.map((key) => (
                      <tr key={key}>
                        <td className="px-3 py-2 font-medium">{key}</td>
                        {plans.map((plan) => (
                          <td key={`${plan.id}-${key}`} className="px-3 py-2">
                            {featureCell(plan, key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {plans.length > 1 ? (
            <Link
              href={`/acquire/${encodeURIComponent(slug)}/configure`}
              className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-5 type-sm font-medium text-[var(--on-primary)]"
            >
              Choisir un plan
            </Link>
          ) : plans.length === 1 ? (
            <Link
              href={buildAcquireApplyHref(slug, {
                defaultFormSlug: page.defaultFormSlug,
                planPresentationId: plans[0].id,
                commercialPlanId: plans[0].commercialPlanId,
              })}
              className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-5 type-sm font-medium text-[var(--on-primary)]"
            >
              {plans[0].ctaLabel?.trim() || "Postuler"}
            </Link>
          ) : (
            <Link
              href={buildAcquireApplyHref(slug, { defaultFormSlug: page.defaultFormSlug })}
              className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-5 type-sm font-medium text-[var(--on-primary)]"
            >
              Postuler
            </Link>
          )}
          {plans.length === 1 ? (
            <Link
              href={`/acquire/${encodeURIComponent(slug)}/configure`}
              className="inline-flex h-[var(--control-height)] items-center border border-[var(--border)] px-5 type-sm text-[var(--text-secondary)]"
            >
              Configuration et checkout
            </Link>
          ) : null}
          <Link
            href="/acquire"
            className="inline-flex h-[var(--control-height)] items-center border border-[var(--border)] px-5 type-sm text-[var(--text-secondary)]"
          >
            Catalogue
          </Link>
        </div>
      </section>
    </div>
  );
}
