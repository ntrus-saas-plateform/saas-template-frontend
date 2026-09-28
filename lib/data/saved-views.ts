"use client";

import { useCallback, useMemo, useState } from "react";
import { usePlatform } from "@/providers/platform-provider";

export type SavedViewState = {
  columns?: string[];
  filters?: Record<string, string>;
  sort?: { id: string; dir: "asc" | "desc" } | null;
  pageSize?: number;
};

function storageKey(userId: string | undefined, resource: string) {
  return `edge.savedView.${userId ?? "anon"}.${resource}`;
}

function readView(key: string): SavedViewState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as SavedViewState;
  } catch {
    return {};
  }
}

export function useSavedViews(resource: string) {
  const { context } = usePlatform();
  const userId = context?.userId ?? undefined;
  const key = storageKey(userId, resource);
  const [version, setVersion] = useState(0);

  const view = useMemo(() => {
    void version;
    return readView(key);
  }, [key, version]);

  const save = useCallback(
    (next: SavedViewState) => {
      localStorage.setItem(key, JSON.stringify(next));
      setVersion((v) => v + 1);
    },
    [key],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setVersion((v) => v + 1);
  }, [key]);

  return { view, save, clear };
}
