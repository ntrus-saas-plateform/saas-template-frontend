"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingsStages } from "@/components/settings/settings-stages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  identityApi,
  type UserPersonalization,
} from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";

type PinDraft = { id: string; label: string; href: string };

function asPins(
  value: UserPersonalization["favorites"] | UserPersonalization["pinnedPages"],
): PinDraft[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (p): p is PinDraft =>
        !!p &&
        typeof p === "object" &&
        typeof p.id === "string" &&
        typeof p.label === "string" &&
        typeof p.href === "string",
    )
    .map((p) => ({ id: p.id, label: p.label, href: p.href }));
}

function PersonalizationForm() {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();

  const [favorites, setFavorites] = useState<PinDraft[]>([]);
  const [pinnedPages, setPinnedPages] = useState<PinDraft[]>([]);
  const [hiddenWidgets, setHiddenWidgets] = useState("");
  const [dirty, setDirty] = useState(false);

  const query = useQuery({
    queryKey: idk.personalization(),
    queryFn: async () => api.users.personalization.get(),
  });

  useEffect(() => {
    const data = query.data?.data;
    if (!data) return;
    setFavorites(asPins(data.favorites));
    setPinnedPages(asPins(data.pinnedPages));
    setHiddenWidgets((data.hiddenWidgets ?? []).join(", "));
    setDirty(false);
  }, [query.dataUpdatedAt]);

  const save = useMutation({
    mutationFn: () =>
      api.users.personalization.patch({
        favorites,
        pinnedPages,
        hiddenWidgets: hiddenWidgets
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      toast.push({ title: "Personalization saved", tone: "success" });
      setDirty(false);
      await qc.invalidateQueries({ queryKey: idk.personalization() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  if (query.isLoading) return <Skeleton className="h-48 w-full max-w-3xl" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load personalization"
        description={
          query.error instanceof Error ? query.error.message : "Try again."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const updatePin = (
    list: PinDraft[],
    setList: (next: PinDraft[]) => void,
    index: number,
    patch: Partial<PinDraft>,
  ) => {
    const next = list.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    setList(next);
    setDirty(true);
  };

  const addPin = (
    list: PinDraft[],
    setList: (next: PinDraft[]) => void,
    prefix: string,
  ) => {
    setList([
      ...list,
      {
        id: `${prefix}-${crypto.randomUUID().slice(0, 8)}`,
        label: "New pin",
        href: "/",
      },
    ]);
    setDirty(true);
  };

  const removePin = (
    list: PinDraft[],
    setList: (next: PinDraft[]) => void,
    index: number,
  ) => {
    setList(list.filter((_, i) => i !== index));
    setDirty(true);
  };

  const renderPins = (
    list: PinDraft[],
    setList: (next: PinDraft[]) => void,
    prefix: string,
  ) => (
    <>
      <div className="flex justify-end sm:col-span-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPin(list, setList, prefix)}
        >
          Add
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="type-sm text-[var(--text-muted)] sm:col-span-2">None yet.</p>
      ) : (
        <ul className="space-y-[var(--space-3)] sm:col-span-2">
          {list.map((pin, index) => (
            <li
              key={`${pin.id}-${index}`}
              className="grid gap-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-app)] p-[var(--space-3)] sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <Field label="Label">
                <Input
                  value={pin.label}
                  onChange={(e) =>
                    updatePin(list, setList, index, { label: e.target.value })
                  }
                />
              </Field>
              <Field label="Href">
                <Input
                  value={pin.href}
                  onChange={(e) =>
                    updatePin(list, setList, index, { href: e.target.value })
                  }
                />
              </Field>
              <Field label="Id">
                <Input
                  value={pin.id}
                  onChange={(e) =>
                    updatePin(list, setList, index, { id: e.target.value })
                  }
                />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePin(list, setList, index)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const data = query.data?.data;
  const savedCounts = [
    { label: "Saved searches", count: data?.savedSearches?.length ?? 0 },
    { label: "Saved filters", count: data?.savedFilters?.length ?? 0 },
    { label: "Saved table views", count: data?.savedTableViews?.length ?? 0 },
    { label: "Widgets", count: data?.widgets?.length ?? 0 },
  ];

  return (
    <SettingsStages
      footer={
        <PermissionGate permission="users:update">
          <Button
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save personalization"}
          </Button>
        </PermissionGate>
      }
      stages={[
        {
          id: "favorites",
          label: "Favorites",
          description: "Shortcuts shown in your workspace.",
          columns: 1,
          content: renderPins(favorites, setFavorites, "fav"),
        },
        {
          id: "pins",
          label: "Pinned pages",
          description: "Pages pinned to your workspace.",
          columns: 1,
          content: renderPins(pinnedPages, setPinnedPages, "pin"),
        },
        {
          id: "widgets",
          label: "Widgets",
          description: "Comma-separated widget ids to hide from your workspace.",
          columns: 1,
          content: (
            <Field label="Widget ids" hint="Example: widget-a, widget-b">
              <Input
                value={hiddenWidgets}
                onChange={(e) => {
                  setHiddenWidgets(e.target.value);
                  setDirty(true);
                }}
                placeholder="widget-a, widget-b"
              />
            </Field>
          ),
        },
        {
          id: "workspace",
          label: "Workspace data",
          description:
            "Searches, filters, and views are updated by product surfaces; this page manages favorites and pins.",
          columns: 1,
          content: (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {savedCounts.map((item) => (
                <Badge key={item.label} tone="info">
                  {item.label}: {item.count}
                </Badge>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}

export default function PersonalizationPage() {
  return (
    <div>
      <PageHeader
        title="Personalization"
        description="Favorites, pinned pages, and workspace layout preferences synced to your account."
      />
      <PermissionGate
        permission="users:read"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need users:read."
          />
        }
      >
        <PersonalizationForm />
      </PermissionGate>
    </div>
  );
}
