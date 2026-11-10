"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import Link from "next/link";

export default function OpportunityWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const query = useQuery({
    queryKey: ["edge", "sales", "opportunity", id],
    queryFn: () => edgeApi.getSalesOpportunity(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <EdgeLoadingState label="Loading workspace…" />;
  if (query.isError) {
    const err = query.error;
    if (err instanceof EdgeApiError && err.status === 403) {
      return <EdgeEmptyState title="Forbidden" />;
    }
    return <EdgeErrorState error={err} onRetry={() => void query.refetch()} />;
  }

  const data = query.data as {
    opportunity?: Record<string, unknown>;
    stage?: Record<string, unknown>;
    risks?: unknown[];
    competitors?: unknown[];
    workspace?: {
      assessments?: unknown[];
      offers?: unknown[];
      quotes?: unknown[];
      proposals?: unknown[];
      contracts?: unknown[];
      activities?: unknown[];
      closeReadiness?: {
        hasAcceptedQuote?: boolean;
        hasExecutedContract?: boolean;
        note?: string;
      };
    };
    weightedPipelineValue?: number | null;
    revenueNote?: string;
  };

  const opp = data.opportunity ?? {};
  const ws = data.workspace;

  return (
    <EdgePermissionGate permission="platform:sales:opportunities:read">
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/edge/sales"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Sales console
          </Link>
          <h1 className="font-display text-3xl tracking-tight">
            {String(opp.name ?? "Opportunity")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {String(opp.opportunityNumber ?? "")} ·{" "}
            {String(data.stage?.name ?? opp.status)} · weighted{" "}
            {data.weightedPipelineValue ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">{data.revenueNote}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Accepted quote"
            value={ws?.closeReadiness?.hasAcceptedQuote ? "Yes" : "No"}
          />
          <Metric
            label="Executed contract"
            value={ws?.closeReadiness?.hasExecutedContract ? "Yes" : "No"}
          />
          <Metric label="Quotes" value={String(ws?.quotes?.length ?? 0)} />
          <Metric
            label="Activities"
            value={String(ws?.activities?.length ?? 0)}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Assessments" items={ws?.assessments} empty="No assessments" />
          <Panel title="Offers" items={ws?.offers} empty="No offer configs" />
          <Panel title="Quotes" items={ws?.quotes} empty="No quotes" />
          <Panel title="Proposals" items={ws?.proposals} empty="No proposals" />
          <Panel title="Contracts" items={ws?.contracts} empty="No contracts" />
          <Panel title="Activities" items={ws?.activities} empty="No activities" />
        </div>

        {ws?.closeReadiness?.note ? (
          <p className="text-xs text-muted-foreground">{ws.closeReadiness.note}</p>
        ) : null}
      </div>
    </EdgePermissionGate>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

function Panel({
  title,
  items,
  empty,
}: {
  title: string;
  items?: unknown[];
  empty: string;
}) {
  const list = (items as Record<string, unknown>[] | undefined) ?? [];
  return (
    <section className="rounded-xl border border-border/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <Badge tone="default">{list.length}</Badge>
      </div>
      {!list.length ? (
        <EdgeEmptyState title={empty} />
      ) : (
        <ul className="space-y-2 text-sm">
          {list.slice(0, 8).map((item, idx) => (
            <li key={String(item.id ?? idx)} className="truncate text-muted-foreground">
              {String(
                item.quoteNumber ??
                  item.proposalNumber ??
                  item.contractNumber ??
                  item.subject ??
                  item.status ??
                  item.id,
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
