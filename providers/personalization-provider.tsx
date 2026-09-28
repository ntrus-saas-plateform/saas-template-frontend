"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { identityApi, type UserPersonalization } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useAppContext } from "@/shell/context/app-context";

type PinItem = { id: string; label: string; href: string; icon?: string };
type RecentItem = PinItem & { at?: string };

type PersonalizationState = {
  favorites: PinItem[];
  pinnedPages: PinItem[];
  recentApplications: RecentItem[];
  recentPages: RecentItem[];
  isLoading: boolean;
  toggleFavorite: (item: PinItem) => void;
  refresh: () => Promise<void>;
};

const PersonalizationCtx = createContext<PersonalizationState | null>(null);

function asPins(value: unknown): PinItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (p): p is PinItem =>
      !!p &&
      typeof p === "object" &&
      typeof (p as PinItem).id === "string" &&
      typeof (p as PinItem).label === "string" &&
      typeof (p as PinItem).href === "string",
  );
}

function asRecent(value: unknown): RecentItem[] {
  return asPins(value).map((p) => ({
    ...p,
    at: typeof (p as RecentItem).at === "string" ? (p as RecentItem).at : undefined,
  }));
}

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const client = useApiClient();
  const { context, apiBaseReady } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const pathname = usePathname() ?? "/";
  const { currentApp } = useAppContext();
  const lastTracked = useRef<string>("");

  const query = useQuery({
    queryKey: idk.personalization(),
    queryFn: async () => api.users.personalization.get(),
    enabled: apiBaseReady,
    staleTime: 60_000,
  });

  const data = query.data?.data;
  const favorites = asPins(data?.favorites);
  const pinnedPages = asPins(data?.pinnedPages);
  const recentApplications = asRecent(data?.recentApplications);
  const recentPages = asRecent(data?.recentPages);

  const patch = useMutation({
    mutationFn: (personalization: Record<string, unknown>) =>
      api.users.personalization.patch(personalization),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: idk.personalization() });
    },
  });

  const toggleFavorite = useCallback(
    (item: PinItem) => {
      const exists = favorites.some((f) => f.id === item.id);
      const next = exists
        ? favorites.filter((f) => f.id !== item.id)
        : [...favorites, item].slice(0, 50);
      patch.mutate({ favorites: next });
    },
    [favorites, patch],
  );

  // Track recent application + page (debounced by path/app change)
  useEffect(() => {
    if (!apiBaseReady || !data) return;
    const key = `${currentApp.id}:${pathname}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const now = new Date().toISOString();
    const appItem: RecentItem = {
      id: `app:${currentApp.id}`,
      label: currentApp.name,
      href: currentApp.href,
      icon: currentApp.icon,
      at: now,
    };
    const pageItem: RecentItem = {
      id: `page:${pathname}`,
      label: pathname,
      href: pathname,
      at: now,
    };

    const nextApps = [
      appItem,
      ...recentApplications.filter((r) => r.id !== appItem.id),
    ].slice(0, 30);
    const nextPages = [
      pageItem,
      ...recentPages.filter((r) => r.id !== pageItem.id),
    ].slice(0, 40);

    const timer = window.setTimeout(() => {
      patch.mutate({
        recentApplications: nextApps,
        recentPages: nextPages,
      });
    }, 800);
    return () => window.clearTimeout(timer);
    // intentionally not depending on recent* to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseReady, currentApp.id, currentApp.href, currentApp.name, currentApp.icon, pathname]);

  const value = useMemo<PersonalizationState>(
    () => ({
      favorites,
      pinnedPages,
      recentApplications,
      recentPages,
      isLoading: query.isLoading,
      toggleFavorite,
      refresh: async () => {
        await query.refetch();
      },
    }),
    [
      favorites,
      pinnedPages,
      recentApplications,
      recentPages,
      query,
      toggleFavorite,
    ],
  );

  return (
    <PersonalizationCtx.Provider value={value}>
      {children}
    </PersonalizationCtx.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationCtx);
  if (!ctx) {
    throw new Error(
      "usePersonalization must be used within PersonalizationProvider",
    );
  }
  return ctx;
}

export type { UserPersonalization, PinItem };
