"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Sync a studio section id with `?section=` (deep-linkable).
 * Falls back to `defaultSection` when the param is missing or not allowed.
 */
export function useStudioSectionParam<T extends string>(
  defaultSection: T,
  allowed: readonly T[],
  paramKey = "section",
): [T, (next: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromUrl = useMemo(() => {
    const raw = searchParams.get(paramKey)?.trim() as T | undefined;
    if (raw && allowed.includes(raw)) return raw;
    return null;
  }, [allowed, paramKey, searchParams]);

  const [section, setSectionState] = useState<T>(fromUrl ?? defaultSection);

  useEffect(() => {
    if (fromUrl) setSectionState(fromUrl);
  }, [fromUrl]);

  const setSection = useCallback(
    (next: T) => {
      setSectionState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set(paramKey, next);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [paramKey, router, searchParams],
  );

  return [section, setSection];
}
