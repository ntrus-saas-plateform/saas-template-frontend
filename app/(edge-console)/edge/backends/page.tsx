"use client";

/**
 * Business Backend registry — catalog of BB systems bound to Edge products.
 * Runtime control (handshake, exchanges) lives in Product Control.
 */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
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

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

const TABS = [
  { id: "registry", label: "Registry" },
  { id: "create", label: "Register BB" },
];

export default function EdgeBackendsPage() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const canRead =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:backends:read");
  const canManage =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:backends:manage");
  const [tab, setTab] = useState("registry");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["edge", "backends"],
    enabled: canRead,
    queryFn: async () => {
      const { data } = await edgeApi.listBackends();
      return data ?? [];
    },
  });

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [backendType, setBackendType] = useState("BUSINESS_BACKEND");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () =>
      edgeApi.createBackend({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || null,
        backendType: backendType.trim() || null,
        lifecycleStatus: "ACTIVE",
      }),
    onSuccess: async () => {
      setFormError(null);
      setCode("");
      setName("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["edge", "backends"] });
      setTab("registry");
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  if (!canRead) {
    return (
      <EdgeForbiddenState description="Requires platform:backends:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <div className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            Business Backends
          </h1>
          <p className="max-w-2xl type-sm text-[var(--text-secondary)]">
            Registry of BB systems that Edge products can bind to. This is not
            the ERP admin console — for live control-plane operations
            (endpoints, handshake, exchanges), open Product Control.
          </p>
        </div>
        <div className="flex flex-wrap gap-[var(--space-2)]">
          <Button asChild variant="outline">
            <Link href="/edge/catalog">Catalog</Link>
          </Button>
          <Button asChild>
            <Link href="/edge/provisioning/product-controls">
              Open Product Control (BB hub)
            </Link>
          </Button>
        </div>
      </header>

      <Tabs
        tabs={canManage ? TABS : TABS.filter((t) => t.id !== "create")}
        value={tab}
        onChange={setTab}
      />

      {tab === "registry" ? (
        <section className="space-y-[var(--space-4)]">
          {query.isLoading ? <EdgeLoadingState /> : null}
          {query.isError ? (
            <EdgeErrorState
              description={errMessage(query.error)}
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {query.isSuccess && !query.data.length ? (
            <EdgeEmptyState
              title="No backends registered"
              description="Register the Business Backend that Edge will provision tenants into."
              actionLabel={canManage ? "Register BB" : undefined}
              onAction={canManage ? () => setTab("create") : undefined}
            />
          ) : null}
          {query.data?.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
              {query.data.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {b.name}
                    </p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {[b.code, b.backendType].filter(Boolean).join(" · ")}
                    </p>
                    {b.description ? (
                      <p className="mt-1 type-sm text-[var(--text-secondary)]">
                        {b.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge>{b.lifecycleStatus ?? "—"}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tab === "create" && canManage ? (
        <EdgePermissionGate permission="platform:backends:manage">
          <form
            className="max-w-xl space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (!code.trim() || !name.trim()) {
                setFormError("Code and name are required.");
                return;
              }
              createMutation.mutate();
            }}
          >
            <h2 className="type-md font-semibold">Register Business Backend</h2>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Code
              </span>
              <input
                className={fieldControlClass}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BB-CORE"
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
                placeholder="Okapi Business Backend"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Type
              </span>
              <input
                className={fieldControlClass}
                value={backendType}
                onChange={(e) => setBackendType(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Description
              </span>
              <textarea
                className={fieldControlClass}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            {formError ? (
              <p className="type-sm text-[var(--danger)]" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Registering…" : "Register backend"}
            </Button>
          </form>
        </EdgePermissionGate>
      ) : null}
    </div>
  );
}
