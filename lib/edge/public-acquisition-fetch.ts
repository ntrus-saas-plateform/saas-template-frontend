import { edgeAppOrigin } from "@/lib/edge-bff/keycloak";

/**
 * SSR-safe fetch through the public acquisition BFF (same allowlist as browser).
 * Prefer this over calling Nest `/api/v1/edge/acquisition/public/**` directly.
 */
export function publicAcquisitionUrl(path: string): string {
  const cleaned = path.replace(/^\//, "");
  return `${edgeAppOrigin()}/api/acquisition-public/${cleaned}`;
}

export async function publicAcquisitionFetch(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  return fetch(publicAcquisitionUrl(path), init);
}
