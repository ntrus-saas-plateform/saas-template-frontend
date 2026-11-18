"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BackLink } from "@/components/ui/back-link";
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

function EdgeNewProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:products:create");

  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [verticalId, setVerticalId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("verticalId");
    if (fromQuery) setVerticalId(fromQuery);
  }, [searchParams]);

  const verticalsQuery = useQuery({
    queryKey: ["edge", "verticals", "create-product"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listVerticals("page=1&limit=100");
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await edgeApi.createProduct({
        code: code.trim(),
        slug: slug.trim(),
        name: name.trim(),
        verticalId,
      });
      return data;
    },
    onSuccess: (product) => {
      if (product?.id) {
        router.push(`/edge/catalog/${product.id}`);
      } else {
        router.push("/edge/catalog");
      }
    },
    onError: (err) => {
      setFormError(
        err instanceof EdgeApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create product",
      );
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:products:create." />
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!code.trim() || !slug.trim() || !name.trim() || !verticalId) {
      setFormError("Code, slug, name, and vertical are required.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href="/edge/catalog" />
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          New product
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Create a catalog product bound to a vertical workspace.
        </p>
      </header>

      {verticalsQuery.isLoading ? <EdgeLoadingState /> : null}
      {verticalsQuery.isError ? (
        <EdgeErrorState
          description={
            verticalsQuery.error instanceof Error
              ? verticalsQuery.error.message
              : "Failed to load verticals"
          }
          onRetry={() => void verticalsQuery.refetch()}
        />
      ) : null}

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]"
      >
        <label className="block space-y-1">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Code
          </span>
          <input
            className={fieldControlClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Slug
          </span>
          <input
            className={fieldControlClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Name
          </span>
          <input
            className={fieldControlClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Vertical
          </span>
          <select
            className={fieldControlClass}
            value={verticalId}
            onChange={(e) => setVerticalId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {(verticalsQuery.data ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.displayName ?? v.name ?? v.code ?? v.id}
              </option>
            ))}
          </select>
        </label>
        {formError ? (
          <p className="type-sm text-[var(--danger)]" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating…" : "Create product"}
        </Button>
      </form>
    </div>
  );
}

export default function EdgeNewProductPage() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading form…" />}>
      <EdgeNewProductForm />
    </Suspense>
  );
}
