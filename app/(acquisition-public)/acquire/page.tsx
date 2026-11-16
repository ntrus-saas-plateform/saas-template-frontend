import Link from "next/link";
import type { Metadata } from "next";
import { edgeApiBase } from "@/lib/edge-bff/keycloak";
import type { ProductPresentation } from "@/types/edge-acquisition";

export const metadata: Metadata = {
  title: "Okapi — Découvrir",
  description: "Découverte publique des produits Okapi",
};

async function loadProducts(): Promise<{
  items: ProductPresentation[];
  error: string | null;
}> {
  try {
    const res = await fetch(
      `${edgeApiBase()}/api/v1/edge/acquisition/public/products?limit=50`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) {
      return { items: [], error: `API ${res.status}` };
    }
    const json = (await res.json()) as {
      data?: { items?: ProductPresentation[]; total?: number } | ProductPresentation[];
      items?: ProductPresentation[];
    };
    const data = json.data ?? json;
    if (Array.isArray(data)) return { items: data, error: null };
    if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
      return { items: data.items, error: null };
    }
    return { items: [], error: null };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

export default async function AcquireDiscoveryPage() {
  const { items, error } = await loadProducts();

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
          Catalogue public filtré côté plateforme — uniquement les présentations
          publiées et commercialement présentables.
        </p>
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
    </div>
  );
}
