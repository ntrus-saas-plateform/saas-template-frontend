import Link from "next/link";
import type { Metadata } from "next";
import {
  filterPublicPresentations,
  type PublicPublishedCatalogSlice,
} from "@/lib/edge/public-acquisition";
import { publicAcquisitionFetch } from "@/lib/edge/public-acquisition-fetch";
import type {
  ProductPresentation,
  SegmentPresentation,
} from "@/types/edge-acquisition";

export const metadata: Metadata = {
  title: "Okapi — Découvrir",
  description: "Découverte publique des produits Okapi",
};

function parseListPayload<T>(json: {
  data?: { items?: T[]; total?: number } | T[];
  items?: T[];
}): T[] {
  const data = json.data ?? json;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}

async function loadProducts(): Promise<{
  items: ProductPresentation[];
  error: string | null;
}> {
  try {
    const res = await publicAcquisitionFetch(`products?limit=50`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return { items: [], error: `API ${res.status}` };
    }
    const json = (await res.json()) as {
      data?: { items?: ProductPresentation[]; total?: number } | ProductPresentation[];
      items?: ProductPresentation[];
    };
    return {
      items: filterPublicPresentations(parseListPayload(json)),
      error: null,
    };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

async function loadPublishedCatalog(): Promise<{
  catalog: PublicPublishedCatalogSlice | null;
  error: string | null;
}> {
  try {
    const res = await publicAcquisitionFetch(`catalog`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return { catalog: null, error: `API ${res.status}` };
    }
    const json = (await res.json()) as {
      data?: PublicPublishedCatalogSlice;
    };
    const catalog = json.data ?? (json as unknown as PublicPublishedCatalogSlice);
    return { catalog, error: null };
  } catch (e) {
    return {
      catalog: null,
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

async function loadSegments(): Promise<{
  items: SegmentPresentation[];
  error: string | null;
}> {
  try {
    const res = await publicAcquisitionFetch(`segments?limit=50`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return { items: [], error: `API ${res.status}` };
    }
    const json = (await res.json()) as {
      data?:
        | { items?: SegmentPresentation[]; total?: number }
        | SegmentPresentation[];
      items?: SegmentPresentation[];
    };
    return { items: parseListPayload(json), error: null };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

export default async function AcquireDiscoveryPage() {
  const [{ items, error }, segments, publishedCatalog] = await Promise.all([
    loadProducts(),
    loadSegments(),
    loadPublishedCatalog(),
  ]);

  const catalogPlans = publishedCatalog.catalog?.plans ?? [];
  const catalogPackages = publishedCatalog.catalog?.packages ?? [];

  return (
    <div className="space-y-10" data-testid="acquire-discovery">
      <section className="space-y-4 pt-4 text-white">
        <p
          className="text-[clamp(2.5rem,7vw,4.5rem)] leading-none tracking-tight"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </p>
        <h1 className="max-w-2xl text-[clamp(1.25rem,3vw,1.75rem)] font-medium text-white/90">
          Choisissez le produit adapté à votre parcours d&apos;abonnement
        </h1>
        <p className="max-w-xl type-md text-white/70">
          Découverte produit : présentations PUBLISHED et disponibilité
          commerciale présentable uniquement (jamais de AVAILABLE inventé pour
          les produits PLANNED / INTERNAL_ONLY).
        </p>
      </section>

      <section
        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]"
        data-testid="acquire-catalog"
      >
        <h2 className="type-lg font-semibold text-[var(--text-primary)]">
          Catalogue commercial publié
        </h2>
        <p className="mt-2 type-sm text-[var(--text-muted)]">
          Plans et packages PUBLISHED (y compris stubs Retail / Hospitality
          PLANNED) — sans lien d&apos;achat public tant que le produit n&apos;est
          pas commercialement présentable.
        </p>
        {publishedCatalog.error ? (
          <p className="mt-4 type-sm text-[var(--danger)]" role="alert">
            Impossible de charger le catalogue commercial ({publishedCatalog.error}
            ).
          </p>
        ) : null}
        {!publishedCatalog.error &&
        catalogPlans.length === 0 &&
        catalogPackages.length === 0 ? (
          <p className="mt-4 type-sm text-[var(--text-muted)]">
            Aucun plan ou package publié pour le moment.
          </p>
        ) : null}
        {catalogPlans.length > 0 ? (
          <ul className="mt-6 divide-y divide-[var(--border)]">
            {catalogPlans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-3"
              >
                <div>
                  <p className="type-sm font-semibold text-[var(--text-primary)]">
                    {plan.name}
                  </p>
                  <p className="type-xs text-[var(--text-muted)]">{plan.code}</p>
                </div>
                <span className="type-xs uppercase text-[var(--text-muted)]">
                  {plan.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {catalogPackages.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {catalogPackages.map((pkg) => (
              <li
                key={pkg.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-3"
              >
                <div>
                  <p className="type-sm font-semibold text-[var(--text-primary)]">
                    {pkg.name}
                  </p>
                  <p className="type-xs text-[var(--text-muted)]">{pkg.code}</p>
                </div>
                <span className="type-xs uppercase text-[var(--text-muted)]">
                  {pkg.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="type-lg font-semibold text-[var(--text-primary)]">Produits</h2>
        {error ? (
          <p className="mt-4 type-sm text-[var(--danger)]" role="alert">
            Impossible de charger le catalogue ({error}). Réessayez plus tard.
          </p>
        ) : null}
        {!error && items.length === 0 ? (
          <p className="mt-4 type-sm text-[var(--text-muted)]">
            Aucun produit publié pour le moment. La liste reste vide — aucun
            placeholder inventé.
          </p>
        ) : null}
        {items.length > 0 ? (
          <ul className="mt-6 divide-y divide-[var(--border)]">
            {items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <div>
                  <Link
                    href={`/acquire/${encodeURIComponent(p.slug)}`}
                    className="type-md font-semibold text-[var(--text-primary)] underline-offset-4 hover:underline"
                  >
                    {p.title}
                  </Link>
                  {p.summary ? (
                    <p className="mt-1 max-w-xl type-sm text-[var(--text-secondary)]">
                      {p.summary}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/acquire/${encodeURIComponent(p.slug)}`}
                  className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-4 type-sm font-medium text-[var(--on-primary)]"
                >
                  Voir
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section
        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]"
        data-testid="acquire-segments"
      >
        <h2 className="type-lg font-semibold text-[var(--text-primary)]">
          Segments publiés
        </h2>
        <p className="mt-2 type-sm text-[var(--text-muted)]">
          Présentations de segments PUBLISHED uniquement — liste vide si aucun seed.
        </p>
        {segments.error ? (
          <p className="mt-4 type-sm text-[var(--danger)]" role="alert">
            Impossible de charger les segments ({segments.error}).
          </p>
        ) : null}
        {!segments.error && segments.items.length === 0 ? (
          <p className="mt-4 type-sm text-[var(--text-muted)]">
            Aucun segment publié pour le moment.
          </p>
        ) : null}
        {segments.items.length > 0 ? (
          <ul className="mt-6 divide-y divide-[var(--border)]">
            {segments.items.map((s) => (
              <li key={s.id} className="py-4">
                <p className="type-md font-semibold text-[var(--text-primary)]">
                  {s.name}
                </p>
                <p className="type-xs text-[var(--text-muted)]">{s.code}</p>
                {s.description ? (
                  <p className="mt-1 max-w-xl type-sm text-[var(--text-secondary)]">
                    {s.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
