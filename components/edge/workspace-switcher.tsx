"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
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

/** Edge workspace switcher — never import OrgSwitcher here. */
export function WorkspaceSwitcher({
  className,
  align = "start",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const {
    workspaces,
    activeVerticalId,
    switchWorkspace,
    isLoading,
  } = useEdgePlatform();
  const [pending, setPending] = useState(false);

  const active =
    workspaces.find((w) => w.vertical.id === activeVerticalId) ??
    workspaces[0];

  if (!workspaces.length) {
    return (
      <span
        className={cn("truncate type-sm text-[var(--text-muted)]", className)}
      >
        {isLoading ? "Loading workspaces…" : "No workspace"}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          className={cn(
            "h-9 max-w-full min-w-0 gap-1.5 border-[var(--border)] bg-[var(--surface-muted)] px-2.5 font-medium sm:h-8 sm:max-w-[16rem] sm:bg-transparent",
            className,
          )}
        >
          <span className="truncate">
            {active?.vertical.name ?? "Select workspace"}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-[min(18rem,calc(100vw-2rem))]"
      >
        <DropdownMenuLabel>Active workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => {
          const selected = ws.vertical.id === (activeVerticalId ?? active?.vertical.id);
          return (
            <DropdownMenuItem
              key={ws.vertical.id}
              disabled={pending}
              onSelect={() => {
                if (selected) return;
                setPending(true);
                void switchWorkspace(ws.vertical.id).finally(() =>
                  setPending(false),
                );
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  {ws.vertical.name ?? ws.vertical.code ?? ws.vertical.id}
                </span>
                <span className="truncate text-xs text-[var(--text-muted)]">
                  {[ws.vertical.code, ws.vertical.status]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {selected ? (
                <Check className="size-4 text-[var(--primary)]" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
