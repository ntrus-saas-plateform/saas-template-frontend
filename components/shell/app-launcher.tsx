"use client";

import type { ComponentType, MouseEvent } from "react";
import Link from "next/link";
import {
  Grid2x2,
  Handshake,
  HeartPulse,
  LayoutDashboard,
  Lock,
  ShoppingCart,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/shell/context/app-context";
import { usePersonalization } from "@/providers/personalization-provider";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  ShoppingCart,
  HeartPulse,
  Handshake,
  Shield,
};

export function AppLauncher() {
  const { apps, currentApp } = useAppContext();
  const { favorites, recentApplications, toggleFavorite } = usePersonalization();
  const visible = apps.filter((app) => app.id !== "core");
  const favoriteApps = visible.filter((app) =>
    favorites.some((f) => f.id === app.id || f.id === `app:${app.id}`),
  );
  const recent = recentApplications
    .map((r) => {
      const appId = r.id.startsWith("app:") ? r.id.slice(4) : r.id;
      return visible.find((a) => a.id === appId);
    })
    .filter((a): a is (typeof visible)[number] => !!a)
    .filter(
      (a, i, arr) => arr.findIndex((x) => x.id === a.id) === i,
    )
    .slice(0, 5);

  const renderApp = (
    app: (typeof visible)[number],
    opts?: { showStar?: boolean },
  ) => {
    const Icon = icons[app.icon] ?? LayoutDashboard;
    const active = app.status === "ACTIVE";
    const isFav = favorites.some(
      (f) => f.id === app.id || f.id === `app:${app.id}`,
    );
    const onStar = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite({
        id: app.id,
        label: app.name,
        href: app.href,
        icon: app.icon,
      });
    };

    return (
      <DropdownMenuItem
        key={app.id}
        asChild={active}
        disabled={!active}
        className="relative"
      >
        {active ? (
          <Link href={app.href} className="flex items-start gap-2 pr-8">
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-medium">
                {app.name}
                {app.id === currentApp.id ? (
                  <span className="text-[10px] uppercase text-[var(--text-muted)]">
                    current
                  </span>
                ) : null}
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                {app.description}
              </span>
            </span>
            {opts?.showStar !== false ? (
              <button
                type="button"
                aria-label={isFav ? "Remove favorite" : "Add favorite"}
                className="absolute right-2 top-2 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--fg)]"
                onClick={onStar}
              >
                <Star
                  className={`size-3.5 ${isFav ? "fill-current text-amber-500" : ""}`}
                />
              </button>
            ) : null}
          </Link>
        ) : (
          <span className="flex items-start gap-2">
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-medium">
                {app.name}
                <Lock className="size-3 text-[var(--text-muted)]" />
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                Unavailable
              </span>
            </span>
          </span>
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Applications">
          <Grid2x2 className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {favoriteApps.length > 0 ? (
          <>
            <DropdownMenuLabel>Favorites</DropdownMenuLabel>
            {favoriteApps.map((app) => renderApp(app))}
            <DropdownMenuSeparator />
          </>
        ) : null}
        {recent.length > 0 ? (
          <>
            <DropdownMenuLabel>Recent</DropdownMenuLabel>
            {recent.map((app) => renderApp(app, { showStar: true }))}
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel>Applications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visible.length === 0 ? (
          <div className="px-2 py-3 text-sm text-[var(--text-muted)]">
            No applications available
          </div>
        ) : (
          visible.map((app) => renderApp(app))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
