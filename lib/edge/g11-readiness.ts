/**
 * G11 readiness badge helpers (doc 34/39) — never invent AVAILABLE.
 */

export type G11Badge = {
  label: string;
  tone: "pass" | "partial" | "blocked" | "unknown";
};

export type G11BadgeUiTone = "success" | "warning" | "danger" | "default";

export function g11BadgeUiTone(tone: G11Badge["tone"]): G11BadgeUiTone {
  switch (tone) {
    case "pass":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "default";
  }
}

export function g11BadgeFromProduct(input: {
  code?: string | null;
  commercialAvailability?: string | null;
  metadata?: Record<string, unknown> | null;
}): G11Badge {
  const avail = (input.commercialAvailability ?? "").toUpperCase();
  const meta = input.metadata ?? {};
  const roadmap = String(meta.rgomRoadmapStatus ?? meta.g11 ?? "").toUpperCase();
  const code = (input.code ?? "").toUpperCase();

  if (avail === "AVAILABLE" && (code === "SYNTIX_PHARMA" || code === "OKAPI_RESTAURANT")) {
    return { label: "G11 beachhead PASS (publish Legal gate)", tone: "pass" };
  }
  if (avail === "INTERNAL_ONLY" || roadmap === "PLANNED" || roadmap.includes("PARTIAL")) {
    return { label: "G11 PARTIAL — INTERNAL_ONLY", tone: "partial" };
  }
  if (avail === "CONTROLLED_ROLLOUT") {
    return { label: "Controlled rollout", tone: "partial" };
  }
  if (avail === "UNAVAILABLE" || avail === "DEPRECATED") {
    return { label: "Not sellable", tone: "blocked" };
  }
  return { label: "G11 unknown", tone: "unknown" };
}
