"use client";

import { useMemo, useState, type FormEvent } from "react";import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function resultTone(
  result?: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (result) {
    case "READY":
      return "success";
    case "NEEDS_REVIEW":
      return "warning";
    case "BLOCKED":
    case "NOT_READY":
      return "danger";
    default:
      return "default";
  }
}

export default function EdgeReadinessPage() {
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:readiness:evaluate");

  const [productId, setProductId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalOk, setEvalOk] = useState<string | null>(null);

  const evaluationsQuery = useQuery({
    queryKey: ["edge", "readiness-evaluations"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listReadinessEvaluations({ limit: 50 });
      return data ?? [];
    },
  });

  const canReadProducts =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:products:read");

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "readiness-picker"],
    enabled: allowed && canReadProducts,
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({ limit: 100 });
      return data ?? [];
    },
  });

  const versionsQuery = useQuery({
    queryKey: ["edge", "products", productId, "versions", "readiness"],
    enabled: allowed && Boolean(productId),
    queryFn: async () => {
      const { data } = await edgeApi.listProductVersions(productId);
      return data ?? [];
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async () =>
      edgeApi.evaluateReadiness(productId, { productVersionId: versionId }),
    onSuccess: async (res) => {
      setEvalOk(`Result: ${res.data?.result ?? "completed"}`);
      setEvalError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "readiness-evaluations"],
      });
    },
    onError: (err) => {
      setEvalOk(null);
      setEvalError(
        err instanceof EdgeApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Evaluation failed",
      );
    },
  });

  const evaluations = evaluationsQuery.data ?? [];
  const needingAttention = useMemo(
    () =>
      evaluations.filter(
        (e) => e.result && e.result !== "READY",
      ),
    [evaluations],
  );

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:readiness:evaluate." />
    );
  }

  function onEvaluate(e: FormEvent) {
    e.preventDefault();
    if (!productId || !versionId) {
      setEvalError("Product and version are required.");
      return;
    }
    evaluateMutation.mutate();
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Readiness
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Publication readiness evaluations across the product catalog.
        </p>
      </header>

      <EdgePermissionGate permission="platform:readiness:evaluate">
        <form
          onSubmit={onEvaluate}
          className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
        >
          <h2 className="type-sm font-semibold text-[var(--text-primary)]">
            Evaluate product
          </h2>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Product
              </span>
              <select
                className={fieldControlClass}
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setVersionId("");
                }}
              >
                <option value="">Select product…</option>
                {(productsQuery.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Version
              </span>
              <select
                className={fieldControlClass}
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                disabled={!productId}
              >
                <option value="">Select version…</option>
                {(versionsQuery.data ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version} · {v.status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {evalError ? (
            <p className="type-sm text-[var(--danger)]">{evalError}</p>
          ) : null}
          {evalOk ? (
            <p className="type-sm text-[var(--success)]">{evalOk}</p>
          ) : null}
          <Button type="submit" disabled={evaluateMutation.isPending}>
            {evaluateMutation.isPending ? "Evaluating…" : "Evaluate"}
          </Button>
        </form>
      </EdgePermissionGate>

      {evaluationsQuery.isLoading ? <EdgeLoadingState /> : null}
      {evaluationsQuery.isError ? (
        <EdgeErrorState
          description={
            evaluationsQuery.error instanceof Error
              ? evaluationsQuery.error.message
              : "Failed to load evaluations"
          }
          onRetry={() => void evaluationsQuery.refetch()}
        />
      ) : null}

      {evaluationsQuery.isSuccess && needingAttention.length ? (
        <section className="space-y-[var(--space-2)]">
          <h2 className="type-md font-semibold text-[var(--text-primary)]">
            Needs attention
          </h2>
          <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
            {needingAttention.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
              >
                <span>
                  <Link
                    href={`/edge/catalog/${item.productId}`}
                    className="font-medium text-[var(--primary)]"
                  >
                    {item.productId}
                  </Link>
                  <span className="mt-1 block type-xs text-[var(--text-muted)]">
                    Version {item.productVersionId}
                    {item.blockers?.length
                      ? ` · ${item.blockers.join(", ")}`
                      : ""}
                  </span>
                </span>
                <Badge tone={resultTone(item.result)}>{item.result}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {evaluationsQuery.isSuccess ? (
        <section className="space-y-[var(--space-2)]">
          <h2 className="type-md font-semibold text-[var(--text-primary)]">
            Recent evaluations
          </h2>
          {!evaluations.length ? (
            <EdgeEmptyState
              title="No evaluations yet"
              description="Run an evaluation against a product version to see results here."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
              {evaluations.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
                >
                  <span>
                    <Link
                      href={`/edge/catalog/${item.productId}`}
                      className="font-medium text-[var(--primary)]"
                    >
                      {item.productId}
                    </Link>
                    <span className="mt-1 block type-xs text-[var(--text-muted)]">
                      {[item.productVersionId, item.createdAt]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <Badge tone={resultTone(item.result)}>{item.result}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
