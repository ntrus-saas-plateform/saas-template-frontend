"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Check, ChevronDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { EdgeVertical } from "@/types/edge";

function verticalLabel(vertical?: EdgeVertical | null) {
  if (!vertical) return "Select vertical";
  return (
    vertical.displayName ??
    vertical.name ??
    vertical.code ??
    vertical.slug ??
    vertical.id
  );
}

function statusTone(status?: string | null) {
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE") return "bg-[var(--success)]";
  if (s === "SUSPENDED" || s === "DEACTIVATION_PENDING")
    return "bg-[var(--warning)]";
  if (s === "DEACTIVATED" || s === "RETIRED" || s === "ARCHIVED")
    return "bg-[var(--danger)]";
  if (s === "DRAFT" || s === "CONFIGURING" || s === "READY_FOR_ACTIVATION")
    return "bg-[var(--info)]";
  return "bg-[var(--text-muted)]";
}

/** Edge vertical / workspace switcher — Vercel-style team context control. */
export function WorkspaceSwitcher({
  className,
  align = "start",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const { workspaces, activeVerticalId, switchWorkspace, isLoading } =
    useEdgePlatform();
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState("");

  const active =
    workspaces.find((w) => w.vertical.id === activeVerticalId) ??
    workspaces[0];

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter((ws) => {
      const hay = [
        ws.vertical.displayName,
        ws.vertical.name,
        ws.vertical.code,
        ws.vertical.slug,
        ws.vertical.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [workspaces, filter]);

  if (!workspaces.length) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn(
          "h-8 max-w-full min-w-[8rem] gap-1.5 border-[var(--border)] bg-[var(--bg-surface)] px-2 font-medium shadow-none",
          className,
        )}
      >
        <Link href="/edge/verticals">
          <Building2 className="size-3.5 shrink-0 text-[var(--text-muted)]" />
          <span className="truncate">
            {isLoading ? "Loading…" : "Select vertical"}
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setFilter("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          aria-label="Select vertical workspace"
          className={cn(
            "h-8 max-w-full min-w-[8rem] gap-1.5 border-[var(--border)] bg-[var(--bg-surface)] px-2 font-medium shadow-none sm:max-w-[16rem]",
            className,
          )}
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              statusTone(active?.vertical.status),
            )}
            aria-hidden
          />
          <Building2 className="size-3.5 shrink-0 text-[var(--text-muted)]" />
          <span className="min-w-0 flex-1 truncate text-left">
            {verticalLabel(active?.vertical)}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
      >
        <div className="border-b border-[var(--border)] px-3 py-2">
          <DropdownMenuLabel className="px-0 py-0">
            Switch vertical
          </DropdownMenuLabel>
          <p className="mt-0.5 type-xs text-[var(--text-muted)]">
            Context for catalog, provisioning & BB control
          </p>
        </div>

        {workspaces.length > 5 ? (
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
            <Search className="size-3.5 shrink-0 text-[var(--text-muted)]" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter verticals…"
              className="h-7 w-full bg-transparent type-sm outline-none placeholder:text-[var(--text-muted)]"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        ) : null}

        <div className="max-h-[min(18rem,50vh)] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center type-sm text-[var(--text-muted)]">
              No matching verticals
            </p>
          ) : (
            filtered.map((ws) => {
              const selected =
                ws.vertical.id === (activeVerticalId ?? active?.vertical.id);
              return (
                <DropdownMenuItem
                  key={ws.vertical.id}
                  disabled={pending}
                  className="items-start py-2"
                  onSelect={() => {
                    if (selected) return;
                    setPending(true);
                    void switchWorkspace(ws.vertical.id).finally(() =>
                      setPending(false),
                    );
                  }}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      statusTone(ws.vertical.status),
                    )}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">
                      {verticalLabel(ws.vertical)}
                    </span>
                    <span className="truncate type-xs text-[var(--text-muted)]">
                      {[ws.vertical.code, ws.vertical.status]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {selected ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
                  ) : null}
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <DropdownMenuItem asChild>
            <Link href="/edge/verticals">
              <Building2 className="size-4" />
              Manage verticals
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/edge/verticals?create=1">
              <Plus className="size-4" />
              Create vertical
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
