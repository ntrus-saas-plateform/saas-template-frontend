/**
 * Client-side public acquisition BFF (`/api/acquisition-public/**`).
 * Miroir des helpers edgeApi.postPublicAcquisition* sans session Edge.
 */

export type PublicApplicationSubmitBody = {
  publicFormSlug: string;
  email: string;
  answers?: Record<string, unknown>;
  displayName?: string | null;
  companyName?: string | null;
  productId?: string | null;
  commercialPlanId?: string | null;
  planPresentationId?: string | null;
  consents?: unknown[];
  honeypot?: string | null;
  submittedAtMs?: number | null;
  challengeId?: string | null;
  challengeToken?: string | null;
  challengeAnswer?: string | null;
  metadata?: Record<string, unknown>;
  submit?: boolean;
  correlationId?: string;
};

export type PublicApplicationSubmitResult = {
  applicationId: string;
  status: string;
  prospectId?: string;
  formPublicationId?: string;
};

function apiErrorMessage(json: unknown, status: number): string {
  if (!json || typeof json !== "object") return `HTTP ${status}`;
  const row = json as { error?: { message?: string }; message?: string };
  return row.error?.message ?? row.message ?? `HTTP ${status}`;
}

/** POST applications — échoue si la réponse ne contient pas d’id dossier Edge. */
export async function postPublicAcquisitionApplication(
  body: PublicApplicationSubmitBody,
): Promise<PublicApplicationSubmitResult> {
  const res = await fetch("/api/acquisition-public/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(apiErrorMessage(json, res.status));
  }

  const envelope =
    json && typeof json === "object" && "data" in json
      ? (json as { data: unknown }).data
      : json;
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Réponse candidature invalide : corps vide.");
  }
  const row = envelope as Record<string, unknown>;
  const application =
    row.application && typeof row.application === "object"
      ? (row.application as Record<string, unknown>)
      : null;
  const applicationId =
    (typeof application?.id === "string" && application.id) ||
    (typeof row.applicationId === "string" && row.applicationId) ||
    null;
  if (!applicationId) {
    throw new Error("Réponse candidature invalide : aucun identifiant dossier Edge.");
  }

  const status =
    (typeof row.status === "string" && row.status) ||
    (typeof application?.status === "string" && application.status) ||
    "UNKNOWN";

  return {
    applicationId,
    status,
    prospectId: typeof row.prospectId === "string" ? row.prospectId : undefined,
    formPublicationId:
      typeof row.formPublicationId === "string" ? row.formPublicationId : undefined,
  };
}

export type PublicLeadSubmitResult = {
  leadId: string;
};

/** POST leads — échoue si pas d’identifiant lead. */
export async function postPublicAcquisitionLead(
  body: Record<string, unknown>,
): Promise<PublicLeadSubmitResult> {
  const res = await fetch("/api/acquisition-public/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(apiErrorMessage(json, res.status));
  }
  const envelope =
    json && typeof json === "object" && "data" in json
      ? (json as { data: unknown }).data
      : json;
  const row = (envelope ?? {}) as Record<string, unknown>;
  const leadId =
    (typeof row.id === "string" && row.id) ||
    (typeof row.leadId === "string" && row.leadId) ||
    (row.lead &&
      typeof row.lead === "object" &&
      typeof (row.lead as Record<string, unknown>).id === "string" &&
      (row.lead as Record<string, unknown>).id) ||
    null;
  if (!leadId || typeof leadId !== "string") {
    throw new Error("Réponse lead invalide : aucun identifiant Edge.");
  }
  return { leadId };
}

export function buildAcquireApplyHref(
  slug: string,
  opts?: {
    defaultFormSlug?: string | null;
    planPresentationId?: string | null;
    commercialPlanId?: string | null;
  },
): string {
  const base = `/acquire/${encodeURIComponent(slug)}/apply`;
  const qs = new URLSearchParams();
  if (opts?.defaultFormSlug?.trim()) qs.set("form", opts.defaultFormSlug.trim());
  if (opts?.planPresentationId?.trim()) {
    qs.set("planPresentationId", opts.planPresentationId.trim());
  }
  if (opts?.commercialPlanId?.trim()) {
    qs.set("commercialPlanId", opts.commercialPlanId.trim());
  }
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}