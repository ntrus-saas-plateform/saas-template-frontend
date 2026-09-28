"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { identityApi } from "@/lib/api/identity";
import { useDateTimeFormat } from "@/lib/format/use-datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

type LocalActivityItem = {
  id: string;
  title: string;
  detail: string;
  at: string;
};

const STORAGE_KEY = "edge.activity";

function loadLocal(): LocalActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LocalActivityItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as LocalActivityItem).id === "string" &&
        typeof (item as LocalActivityItem).title === "string",
    );
  } catch {
    return [];
  }
}

/** Append a real client-side activity event and sync to the server when possible. */
export function pushActivity(title: string, detail: string) {
  if (typeof window === "undefined") return;
  const item: LocalActivityItem = {
    id: crypto.randomUUID(),
    title,
    detail,
    at: new Date().toISOString(),
  };
  const next = [item, ...loadLocal()].slice(0, 40);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("edge-activity"));
  window.dispatchEvent(
    new CustomEvent("edge-activity-sync", {
      detail: { title, detail, category: "shell" },
    }),
  );
}

export function ActivityCenter() {
  const client = useApiClient();
  const { context, apiBaseReady } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const { formatDateTime: fmt } = useDateTimeFormat();
  const [tick, setTick] = useState(0);

  const remoteQuery = useQuery({
    queryKey: idk.activity(),
    queryFn: async () => api.users.activity.list(1, 20),
    enabled: apiBaseReady,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const onLocal = () => setTick((t) => t + 1);
    const onSync = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{ title: string; detail: string; category?: string }>
      ).detail;
      if (!detail?.title || !apiBaseReady) return;
      void api.users.activity
        .create({
          title: detail.title,
          detail: detail.detail,
          category: detail.category ?? "shell",
        })
        .then(() => qc.invalidateQueries({ queryKey: idk.activity() }))
        .catch(() => undefined);
    };
    window.addEventListener("edge-activity", onLocal);
    window.addEventListener("edge-activity-sync", onSync as EventListener);
    return () => {
      window.removeEventListener("edge-activity", onLocal);
      window.removeEventListener("edge-activity-sync", onSync as EventListener);
    };
  }, [api, apiBaseReady, idk, qc]);

  const localItems = useMemo(() => {
    void tick;
    return loadLocal();
  }, [tick]);

  const remoteItems = remoteQuery.data?.data ?? [];
  const items =
    remoteItems.length > 0
      ? remoteItems.map((e) => ({
          id: e.id,
          title: e.title,
          detail: e.detail,
          at: e.createdAt,
        }))
      : localItems;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          setTick((t) => t + 1);
          void remoteQuery.refetch();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Activity">
          <History className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2">
          <DropdownMenuLabel className="px-0">Activity</DropdownMenuLabel>
          {items.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void api.users.activity.clear().then(async () => {
                  localStorage.removeItem(STORAGE_KEY);
                  setTick((t) => t + 1);
                  await qc.invalidateQueries({ queryKey: idk.activity() });
                });
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-3 text-sm text-[var(--text-muted)]">
            No recent activity
          </div>
        ) : (
          items.slice(0, 12).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {item.detail}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {fmt(item.at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
