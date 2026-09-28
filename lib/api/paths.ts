import { isBffAuthMode } from "@/lib/auth/mode";

/** Prefix API paths for BFF proxy (`/api/backend/...`) or direct backend (`/api/v1/...`). */
export function v1(path: string) {
  const p = path.startsWith("/") ? path.slice(1) : path;
  if (isBffAuthMode()) return `/api/backend/${p}`;
  return `/api/v1/${p}`;
}

export function withQuery(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
) {
  if (!params) return path;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    q.set(key, String(value));
  }
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}
