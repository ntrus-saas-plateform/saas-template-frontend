"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  EdgeErrorState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import { useEdgeSession } from "@/providers/edge-session-provider";

export default function EdgePortfolioPage() {
  const auth = useEdgeSession();
  const { me, workspaces, activeWorkspace, permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const canReadProducts =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:products:read");
  const canReadVerticals =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:verticals:read");

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "portfolio"],
    enabled: canReadProducts,
    queryFn: async () => {
      const { data, pagination } = await edgeApi.listProducts({ limit: 1 });
      return { count: pagination?.total ?? data?.length ?? 0 };
    },
  });

  const verticalsQuery = useQuery({
    queryKey: ["edge", "verticals", "portfolio"],
    enabled: canReadVerticals,
    queryFn: async () => {
      const { data, pagination } = await edgeApi.listVerticals(
        "page=1&limit=1",
      );
      return { count: pagination?.total ?? data?.length ?? 0 };
    },
  });

  const activeName =
    activeWorkspace?.vertical?.name ??
    workspaces.find(
      (w) => w.vertical.id === activeWorkspace?.session?.verticalId,
    )?.vertical.name;

  const loading =
    (canReadProducts && productsQuery.isLoading) ||
    (canReadVerticals && verticalsQuery.isLoading);
  const errored =
    (canReadProducts && productsQuery.isError) ||
    (canReadVerticals && verticalsQuery.isError);

  return (
    <div className="space-y-[var(--space-8)]">
      <section className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-6)] py-[var(--space-8)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 12%, transparent), transparent 45%), radial-gradient(ellipse at 100% 0%, color-mix(in oklab, var(--secondary) 16%, transparent), transparent 50%)",
          }}
        />
        <div className="relative max-w-2xl space-y-[var(--space-3)]">
          <p className="type-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Portfolio overview
          </p>
          <h1
            className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl"
            style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
          >
            Okapi Edge
          </h1>
          <p className="type-md text-[var(--text-secondary)]">
            Product catalog, market taxonomy, and readiness — outside the ERP
            shell.
          </p>
          <div className="flex flex-wrap gap-[var(--space-2)] pt-[var(--space-2)]">
            <Button asChild>
              <Link href="/edge/catalog">Open catalog</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/edge/verticals">Taxonomy · verticals</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/edge/readiness">Readiness</Link>
            </Button>
          </div>
        </div>
      </section>

      {loading ? <EdgeLoadingState label="Loading portfolio…" /> : null}
      {errored ? (
        <EdgeErrorState
          description="Failed to load portfolio counts from the Edge API."
          onRetry={() => {
            void productsQuery.refetch();
            void verticalsQuery.refetch();
          }}
        />
      ) : null}

      {!loading && !errored ? (
        <section className="grid gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStat
            label="Products"
            value={
              canReadProducts
                ? String(productsQuery.data?.count ?? 0)
                : "—"
            }
            href={canReadProducts ? "/edge/catalog" : undefined}
          />
          <OverviewStat
            label="Verticals"
            value={
              canReadVerticals
                ? String(verticalsQuery.data?.count ?? 0)
                : "—"
            }
            href={canReadVerticals ? "/edge/verticals" : undefined}
          />
          <OverviewStat
            label="Workspaces"
            value={String(workspaces.length)}
          />
          <OverviewStat
            label="Active workspace"
            value={activeName ?? "None selected"}
          />
        </section>
      ) : null}

      <section className="space-y-[var(--space-2)]">
        <h2 className="type-md font-semibold text-[var(--text-primary)]">
          Signed in as
        </h2>
        <p className="type-sm text-[var(--text-secondary)]">
          {me?.displayName ?? auth.user?.name ?? auth.user?.email ?? "—"}
        </p>
      </section>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 type-lg font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-4)] py-[var(--space-4)] transition-colors hover:bg-[var(--surface-muted)]"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-4)] py-[var(--space-4)]">
      {inner}
    </div>
  );
}
