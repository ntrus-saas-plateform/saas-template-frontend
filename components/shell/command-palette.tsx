"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Building2,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react";
import { useCommandPalette } from "@/shell/commands/command-palette-context";
import { usePreferences } from "@/providers/preferences-provider";
import { useAppContext } from "@/shell/context/app-context";
import { hasPermission } from "@/lib/access/permissions";
import { usePlatform } from "@/providers/platform-provider";
import { useSearchProviders } from "@/lib/search/providers";

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 type-sm text-[var(--text-primary)] data-[selected=true]:bg-[var(--primary-soft)]";

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:type-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--text-muted)]";

function NavIcon({ href }: { href: string }) {
  if (href === "/") return <LayoutDashboard className="size-4 shrink-0 text-[var(--text-muted)]" />;
  if (href.startsWith("/identity/organizations") || href.startsWith("/admin")) {
    return <Building2 className="size-4 shrink-0 text-[var(--text-muted)]" />;
  }
  if (href.startsWith("/identity") || href.startsWith("/settings")) {
    return <Users className="size-4 shrink-0 text-[var(--text-muted)]" />;
  }
  return <Search className="size-4 shrink-0 text-[var(--text-muted)]" />;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const { apps } = useAppContext();
  const { capabilities, context, organizations, switchOrganization } =
    usePlatform();
  const { locale } = usePreferences();
  const fr = locale === "fr";
  const [search, setSearch] = useState("");
  const q = search.trim();
  const { hits: searchHits, isLoading } = useSearchProviders(open ? search : "");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const navItems = useMemo(() => {
    const perms = capabilities?.permissions ?? context?.permissions ?? [];
    return apps
      .filter((a) => a.status === "ACTIVE")
      .flatMap((a) =>
        a.navigation.filter(
          (n) => !n.permission || hasPermission(perms, n.permission),
        ),
      );
  }, [apps, capabilities?.permissions, context?.permissions]);

  const qLower = q.toLowerCase();
  const matchedNav =
    q.length >= 1
      ? navItems.filter(
          (item) =>
            item.label.toLowerCase().includes(qLower) ||
            item.href.toLowerCase().includes(qLower),
        )
      : [];
  const matchedOrgs =
    q.length >= 2
      ? organizations.filter(
          (org) =>
            org.name.toLowerCase().includes(qLower) ||
            org.slug.toLowerCase().includes(qLower),
        )
      : [];

  const hasResults =
    matchedNav.length > 0 || searchHits.length > 0 || matchedOrgs.length > 0;

  const run = (fn: () => void) => {
    setOpen(false);
    setSearch("");
    fn();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)]"
        aria-label={fr ? "Fermer la recherche" : "Close search"}
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-full max-w-xl px-4">
        <Command
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] elevation-2"
          label={fr ? "Recherche" : "Search"}
          shouldFilter={false}
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
            <Search className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={
                fr
                  ? "Rechercher organisations et utilisateurs…"
                  : "Search organizations and users…"
              }
              className="h-12 w-full bg-transparent type-sm outline-none placeholder:text-[var(--text-muted)]"
            />
            <kbd className="hidden shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {q.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <Search
                  className="mx-auto mb-3 size-8 text-[var(--text-muted)]"
                  aria-hidden
                />
                <p className="type-sm text-[var(--text-secondary)]">
                  {fr
                    ? "Tapez pour rechercher une organisation ou un utilisateur…"
                    : "Type to search organizations and users…"}
                </p>
              </div>
            ) : (
              <>
                {!hasResults && !isLoading ? (
                  <Command.Empty className="px-3 py-8 text-center type-sm text-[var(--text-muted)]">
                    {fr ? "Aucun résultat" : "No results"}
                  </Command.Empty>
                ) : null}

                {isLoading && searchHits.length === 0 && q.length >= 2 ? (
                  <p className="px-3 py-2 type-sm text-[var(--text-muted)]">
                    {fr ? "Recherche…" : "Searching…"}
                  </p>
                ) : null}

                {searchHits.length > 0 ? (
                  <Command.Group
                    heading={fr ? "Résultats" : "Results"}
                    className={groupClass}
                  >
                    {searchHits.map((hit) => (
                      <Command.Item
                        key={`${hit.group}-${hit.id}`}
                        value={`${hit.group} ${hit.label} ${hit.href} ${hit.id}`}
                        onSelect={() => run(() => router.push(hit.href))}
                        className={itemClass}
                      >
                        <span className="w-20 shrink-0 truncate type-xs text-[var(--text-muted)]">
                          {hit.group}
                        </span>
                        <span className="min-w-0 truncate font-medium">{hit.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}

                {matchedNav.length > 0 ? (
                  <Command.Group
                    heading={fr ? "Pages" : "Pages"}
                    className={groupClass}
                  >
                    {matchedNav.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.href}`}
                        onSelect={() => run(() => router.push(item.href))}
                        className={itemClass}
                      >
                        <NavIcon href={item.href} />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}

                {matchedOrgs.length > 0 ? (
                  <Command.Group
                    heading={fr ? "Organisations" : "Organizations"}
                    className={groupClass}
                  >
                    {matchedOrgs.map((org) => (
                      <Command.Item
                        key={org.id}
                        value={`org ${org.name} ${org.slug}`}
                        onSelect={() =>
                          run(() => {
                            void switchOrganization(org.id);
                          })
                        }
                        className={itemClass}
                      >
                        <Building2 className="size-4 shrink-0 text-[var(--text-muted)]" />
                        <span className="min-w-0 truncate">{org.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
