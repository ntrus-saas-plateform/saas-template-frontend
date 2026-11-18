import type { PublicFormPayload } from "@/types/edge-acquisition";

export type PublicFormSubmitIntent = "LEAD" | "APPLICATION";

type MetaBag = Record<string, unknown> | null | undefined;

const LEAD_TOKENS = [
  "CONTACT",
  "DEMO",
  "DEMO_REQUEST",
  "NEWSLETTER",
  "LEAD",
  "INQUIRY",
];

const APPLICATION_TOKENS = [
  "APPLICATION",
  "APPLY",
  "CANDIDATURE",
  "ACQUISITION",
  "ONBOARD",
  "SIGNUP",
];

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().toUpperCase();
  return t || null;
}

function tokensFromString(value: string): string[] {
  return value
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

function readMode(meta: MetaBag): string | null {
  if (!meta || typeof meta !== "object") return null;
  const raw =
    meta.publicSubmitMode ??
    meta.submitMode ??
    meta.captureMode ??
    meta.formIntent ??
    meta.formType ??
    meta.purpose;
  return normalizeToken(raw);
}

function modeToIntent(mode: string | null): PublicFormSubmitIntent | null {
  if (!mode) return null;
  if (mode === "LEAD" || mode === "LEAD_ONLY" || mode === "CAPTURE_LEAD") return "LEAD";
  if (
    mode === "APPLICATION" ||
    mode === "APPLICATION_SUBMIT" ||
    mode === "FULL_APPLICATION"
  ) {
    return "APPLICATION";
  }
  if (mode.includes("APPLICATION")) return "APPLICATION";
  if (mode.includes("LEAD")) return "LEAD";
  return null;
}

function intentFromLabels(...parts: Array<string | null | undefined>): PublicFormSubmitIntent | null {
  const tokens = parts
    .filter((p): p is string => Boolean(p?.trim()))
    .flatMap((p) => tokensFromString(p));
  if (tokens.length === 0) return null;
  const hasApp = tokens.some((t) =>
    APPLICATION_TOKENS.some((a) => t === a || t.includes(a)),
  );
  const hasLead = tokens.some((t) =>
    LEAD_TOKENS.some((l) => t === l || t.includes(l)),
  );
  if (hasApp && !hasLead) return "APPLICATION";
  if (hasLead && !hasApp) return "LEAD";
  if (hasApp) return "APPLICATION";
  return null;
}

/** Decide whether public apply should POST leads-only or full public application. */
export function resolvePublicFormSubmitIntent(
  payload: PublicFormPayload | null,
): PublicFormSubmitIntent {
  if (!payload) return "LEAD";

  const fromMeta = [
    readMode(payload.publication?.metadata),
    readMode(payload.schema?.metadata),
    readMode(payload.formVersion?.metadata),
    readMode(payload.formVersion?.schemaDefinition as MetaBag),
  ]
    .map(modeToIntent)
    .find((x): x is PublicFormSubmitIntent => x != null);
  if (fromMeta) return fromMeta;

  const fromLabels = intentFromLabels(
    payload.schema?.code,
    payload.schema?.name,
    typeof payload.schema?.metadata?.kind === "string"
      ? payload.schema.metadata.kind
      : null,
  );
  if (fromLabels) return fromLabels;

  return "APPLICATION";
}

export type PublicConsentSubmission = {
  purpose: string;
  channel: string;
  textVersion: string;
  decision: "GRANTED" | "DENIED" | "NOT_PROVIDED" | "WITHDRAWN";
  locale?: string;
  consentRef?: string;
  decidedAt?: string;
};

function isCheckedValue(raw: string | undefined): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "on" || v === "yes";
}

/** Map schema requiredConsents + checkbox answers when declared (fail-closed on missing mandatory). */
export function buildPublicFormConsents(
  payload: PublicFormPayload | null,
  values: Record<string, string>,
): PublicConsentSubmission[] | undefined {
  if (!payload) return undefined;
  const def = payload.formVersion?.schemaDefinition;
  const fromSchema = def?.requiredConsents;
  const fromPublication = payload.publication?.metadata?.requiredConsents;
  const raw = Array.isArray(fromSchema)
    ? fromSchema
    : Array.isArray(fromPublication)
      ? fromPublication
      : null;
  if (!raw?.length) return undefined;

  const decidedAt = new Date().toISOString();
  const out: PublicConsentSubmission[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const purpose = String(row.purpose ?? "").trim();
    const channel = String(row.channel ?? "").trim();
    const textVersion = String(row.textVersion ?? "").trim();
    if (!purpose || !channel || !textVersion) continue;

    const fieldKey =
      (typeof row.fieldKey === "string" && row.fieldKey.trim()) ||
      (typeof row.key === "string" && row.key.trim()) ||
      `consent_${purpose}`.toLowerCase();

    const checked = isCheckedValue(values[fieldKey]);
    const mandatory = row.mandatory !== false;

    out.push({
      purpose,
      channel,
      textVersion,
      decision: checked ? "GRANTED" : mandatory ? "NOT_PROVIDED" : "DENIED",
      locale: typeof row.locale === "string" ? row.locale : undefined,
      consentRef: typeof row.consentRef === "string" ? row.consentRef : undefined,
      decidedAt,
    });
  }

  return out.length > 0 ? out : undefined;
}

export function pickLeadEmail(values: Record<string, string>): string | null {
  const direct =
    values.email?.trim() ||
    values.Email?.trim() ||
    Object.entries(values).find(([k]) => k.toLowerCase().includes("email"))?.[1]?.trim();
  return direct || null;
}

export function pickDisplayName(values: Record<string, string>): string | null {
  const keys = ["displayName", "name", "fullName", "contactName"];
  for (const k of keys) {
    const v = values[k]?.trim();
    if (v) return v;
  }
  const hit = Object.entries(values).find(([k]) => {
    const l = k.toLowerCase();
    return l.includes("name") && !l.includes("company") && !l.includes("email");
  });
  return hit?.[1]?.trim() || null;
}

export function pickCompanyName(values: Record<string, string>): string | null {
  const keys = ["companyName", "company", "organization", "org"];
  for (const k of keys) {
    const v = values[k]?.trim();
    if (v) return v;
  }
  const hit = Object.entries(values).find(([k]) => k.toLowerCase().includes("company"));
  return hit?.[1]?.trim() || null;
}