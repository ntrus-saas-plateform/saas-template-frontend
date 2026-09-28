"use client";

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
import { usePlatform } from "@/providers/platform-provider";

export function OrgSwitcher({
  className,
  align = "start",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const {
    organizations,
    context,
    switchOrganization,
    isLoading,
  } = usePlatform();

  const activeId = context?.organizationId;
  const active =
    organizations.find((o) => o.id === activeId) ?? organizations[0];

  if (!organizations.length) {
    return (
      <span className={cn("truncate text-sm text-[var(--text-muted)]", className)}>
        {isLoading ? "Loading…" : "No organization"}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 max-w-full min-w-0 gap-1.5 border-[var(--border)] bg-[var(--surface-muted)] px-2.5 font-medium sm:h-8 sm:max-w-[14rem] sm:bg-transparent",
            className,
          )}
        >
          <span className="truncate">
            {active?.name ?? "Select organization"}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[min(18rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Current organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => {
          const selected = org.id === (activeId ?? active?.id);
          return (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => {
                if (!selected) void switchOrganization(org.id);
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{org.name}</span>
                <span className="truncate text-xs text-[var(--text-muted)]">
                  {org.slug} · {org.status}
                </span>
              </span>
              {selected ? <Check className="size-4 text-[var(--primary)]" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
