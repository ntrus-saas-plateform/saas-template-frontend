import { Badge } from "@/components/ui/badge";
import {
  g11BadgeFromProduct,
  g11BadgeUiTone,
} from "@/lib/edge/g11-readiness";

type ProductG11Input = {
  code?: string | null;
  commercialAvailability?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function G11ProductBadge({
  product,
  compact = false,
}: {
  product: ProductG11Input;
  /** Shorter label in dense tables. */
  compact?: boolean;
}) {
  const badge = g11BadgeFromProduct(product);
  const label = compact
    ? badge.tone === "pass"
      ? "G11 PASS"
      : badge.tone === "partial"
        ? "G11 PARTIAL"
        : badge.tone === "blocked"
          ? "Not sellable"
          : "G11 ?"
    : badge.label;
  return (
    <Badge tone={g11BadgeUiTone(badge.tone)} title={badge.label}>
      {label}
    </Badge>
  );
}