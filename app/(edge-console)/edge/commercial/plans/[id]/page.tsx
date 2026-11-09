"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeCommercialPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const canRead =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:commercial:plans:read");
  const canEvaluate =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:commercial:readiness:evaluate");
  const canPublish =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:commercial:offers:publish");

  const [priceBookId, setPriceBookId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: ["edge", "commercial", "plans", planId],
    enabled: canRead && Boolean(planId),
    queryFn: async () => {
      const { data } = await edgeApi.getCommercialPlan(planId);
      return data;
    },
  });

  const plan = planQuery.data ?? null;

  const booksQuery = useQuery({
    queryKey: ["edge", "commercial", "price-books", plan?.productId],
    enabled: canRead && Boolean(plan?.productId),
    queryFn: async () => {
      const { data } = await edgeApi.listPriceBooks(plan!.productId);
      return data ?? [];
    },
  });

  const evaluate = useMutation({
    mutationFn: async () =>
      edgeApi.evaluateCommercialPlanReadiness(planId, {
        priceBookId: priceBookId || null,
      }),
    onSuccess: (res) => {
      setError(null);
      setMessage(
        `Readiness: ${res.data.result}. Blockers: ${(res.data.blockers ?? []).length}`,
      );
    },
    onError: (err) => {
      setMessage(null);
      setError(
        err instanceof EdgeApiError ? err.message : "Readiness evaluation failed",
      );
    },
  });

  const publish = useMutation({
    mutationFn: async () =>
      edgeApi.publishCommercialPlan(planId, {
        priceBookId: priceBookId || null,
      }),
    onSuccess: async () => {
      setError(null);
      setMessage("Plan published with immutable snapshot.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "plans", planId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["edge", "commercial", "plans"],
      });
    },
    onError: (err) => {
      setMessage(null);
      setError(
        err instanceof EdgeApiError ? err.message : "Publication refused",
      );
    },
  });

  if (!canRead) {
    return (
      <EdgeForbiddenState description="Requires platform:commercial:plans:read." />
    );
  }

  if (planQuery.isLoading) return <EdgeLoadingState />;
  if (planQuery.isError) {
    return <EdgeErrorState description="Unable to load plan." />;
  }
  if (!plan) {
    return <EdgeErrorState description="Plan not found." />;
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <div className="space-y-[var(--space-1)]">
        <Link
          href="/edge/commercial"
          className="type-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Commercial catalog
        </Link>
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          {plan.name}
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          {plan.code} · {plan.planTier} · v{plan.version}
        </p>
        <Badge tone={plan.status === "PUBLISHED" ? "success" : "default"}>
          {plan.status}
        </Badge>
      </div>

      <section className="max-w-lg space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Commercial readiness</h2>
        <p className="type-sm text-[var(--text-secondary)]">
          Publication is blocked unless product is published, capabilities are
          P1-valid, and currency is present when a price book is attached.
        </p>
        <label className="block space-y-1 type-sm">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Price book (optional)
          </span>
          <select
            className={fieldControlClass}
            value={priceBookId}
            onChange={(e) => setPriceBookId(e.target.value)}
          >
            <option value="">None</option>
            {(booksQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} ({b.currency})
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-[var(--space-2)]">
          {canEvaluate ? (
            <Button
              type="button"
              variant="outline"
              disabled={evaluate.isPending}
              onClick={() => evaluate.mutate()}
            >
              Evaluate readiness
            </Button>
          ) : null}
          {canPublish ? (
            <Button
              type="button"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
            >
              Publish
            </Button>
          ) : null}
        </div>
        {message ? (
          <p className="type-sm text-[var(--text-primary)]">{message}</p>
        ) : null}
        {error ? (
          <p className="type-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
