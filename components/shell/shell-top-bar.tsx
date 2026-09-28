"use client";

import Link from "next/link";
import {
  Globe,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  UserRound,
} from "lucide-react";
import { ActivityCenter } from "@/components/shell/activity-center";
import { NotificationCenter } from "@/components/shell/notification-center";
import { OrgSwitcher } from "@/components/shell/org-switcher";
import { TaskCenter } from "@/components/shell/task-center";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import { useAppContext } from "@/shell/context/app-context";
import { usePlatform } from "@/providers/platform-provider";
import { useCommandPalette } from "@/shell/commands/command-palette-context";
import { usePreferences } from "@/providers/preferences-provider";
import type { Locale } from "@/lib/i18n/messages";

function userInitials(name?: string | null, username?: string | null): string {
  const source = (name || username || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function UserAvatar({
  picture,
  name,
  username,
  className,
}: {
  picture?: string | null;
  name?: string | null;
  username?: string | null;
  className?: string;
}) {
  if (picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Keycloak/OIDC avatar URLs are external
      <img
        src={picture}
        alt=""
        className={
          className ??
          "size-8 rounded-full object-cover ring-2 ring-[var(--surface)]"
        }
      />
    );
  }
  return (
    <span
      className={
        className ??
        "flex size-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-semibold text-[var(--primary)]"
      }
      aria-hidden
    >
      {userInitials(name, username)}
    </span>
  );
}

export function ShellTopBar({
  onOpenMobileNav,
}: {
  onOpenMobileNav?: () => void;
}) {
  const auth = useAuth();
  const { currentApp } = useAppContext();
  const { context } = usePlatform();
  const { setOpen } = useCommandPalette();
  const { locale, setLocale } = usePreferences();

  const displayName =
    auth.user?.name ?? auth.user?.username ?? context?.username ?? "User";

  return (
    <header className="sticky top-0 z-[var(--z-header)] flex h-[var(--header-height)] items-center gap-[var(--space-3)] border-b border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-3)] sm:px-[var(--space-4)] lg:px-[var(--space-6)]">
      <div className="shrink-0 sm:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ouvrir le menu"
          onClick={onOpenMobileNav}
        >
          <Menu className="size-[var(--icon-md)]" />
        </Button>
      </div>
      <div className="hidden min-w-0 shrink-0 md:block">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {currentApp.name}
        </p>
      </div>

      <div className="min-w-0 flex-1 md:max-w-[14rem] md:flex-none">
        <OrgSwitcher className="w-full justify-between" />
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-left text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface)] md:flex lg:max-w-lg"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">
          {locale === "fr" ? "Rechercher…" : "Search…"}
        </span>
        <kbd className="hidden rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] lg:inline">
          Ctrl+K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          onClick={() => setOpen(true)}
          aria-label={locale === "fr" ? "Rechercher" : "Search"}
        >
          <Search className="size-4" />
        </Button>

        <div className="hidden items-center gap-0.5 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Language"
                title={`Language: ${locale.toUpperCase()}`}
              >
                <Globe className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                [
                  { id: "en", label: "English" },
                  { id: "fr", label: "Français" },
                ] as { id: Locale; label: string }[]
              ).map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onSelect={() => setLocale(opt.id)}
                >
                  {opt.label}
                  {locale === opt.id ? (
                    <span className="ml-auto text-[var(--primary)]">✓</span>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationCenter />
          <TaskCenter />
          <ActivityCenter />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 md:hidden"
              aria-label="More"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Preferences</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(
              [
                { id: "en", label: "English" },
                { id: "fr", label: "Français" },
              ] as { id: Locale; label: string }[]
            ).map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onSelect={() => setLocale(opt.id)}
              >
                <Globe className="size-4" />
                {opt.label}
                {locale === opt.id ? (
                  <span className="ml-auto text-[var(--primary)]">✓</span>
                ) : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 rounded-full p-0 sm:h-9 sm:w-auto sm:gap-2 sm:px-2 lg:pl-1 lg:pr-2.5"
              aria-label="Account menu"
            >
              <UserAvatar
                picture={auth.user?.picture}
                name={auth.user?.name}
                username={auth.user?.username ?? context?.username}
                className="size-8 rounded-full object-cover ring-2 ring-[var(--surface)] flex items-center justify-center bg-[var(--primary-soft)] text-[11px] font-semibold text-[var(--primary)]"
              />
              <span className="hidden max-w-[9rem] truncate text-sm font-medium lg:inline">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(16rem,calc(100vw-2rem))]">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <UserAvatar
                  picture={auth.user?.picture}
                  name={auth.user?.name}
                  username={auth.user?.username ?? context?.username}
                />
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="truncate font-medium">{displayName}</span>
                  {auth.user?.email ? (
                    <span className="truncate font-normal text-[var(--text-muted)]">
                      {auth.user.email}
                    </span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <UserRound className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              <Search className="size-4" />
              {locale === "fr" ? "Rechercher" : "Search"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void auth.logout();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
