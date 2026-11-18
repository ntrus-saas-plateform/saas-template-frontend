/**
 * Public acquisition filters (P10) — mirrors backend `PRESENTABLE_COMMERCIAL_AVAILABILITY`.
 * Never invent AVAILABLE for PLANNED / INTERNAL_ONLY products.
 */

export const PRESENTABLE_COMMERCIAL_AVAILABILITY = new Set<string>([
  "AVAILABLE",
  "BETA",
  "CONTROLLED_ROLLOUT",
  "BY_REQUEST",
  "ENTERPRISE",
]);

export function isCommerciallyPresentable(
  availability: string | null | undefined,
): boolean {
  if (!availability?.trim()) return false;
  return PRESENTABLE_COMMERCIAL_AVAILABILITY.has(availability.trim().toUpperCase());
}

/** Belt-and-suspenders for public discovery lists (presentation must already be PUBLISHED server-side). */
export function filterPublicPresentations<T extends { status?: string | null }>(
  items: readonly T[],
): T[] {
  return items.filter((p) => (p.status ?? "").toUpperCase() === "PUBLISHED");
}

export type PublicPublishedCatalogSlice = {
  view?: string;
  note?: string;
  plans?: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    productId?: string;
    verticalId?: string;
  }>;
  packages?: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    productId?: string;
    verticalId?: string;
  }>;
};