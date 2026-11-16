"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  FormFieldDefinition,
  PublicFormPayload,
} from "@/types/edge-acquisition";

function collectFields(payload: PublicFormPayload | null): FormFieldDefinition[] {
  if (!payload?.formVersion?.schemaDefinition) return [];
  const def = payload.formVersion.schemaDefinition;
  const fromRoot = Array.isArray(def.fields) ? def.fields : [];
  const fromSections = Array.isArray(def.sections)
    ? def.sections.flatMap((s) => (Array.isArray(s.fields) ? s.fields : []))
    : [];
  const merged = [...fromRoot, ...fromSections];
  const seen = new Set<string>();
  return merged.filter((f) => {
    if (!f?.key || seen.has(f.key)) return false;
    seen.add(f.key);
    return true;
  });
}

function optionLabels(options: unknown[] | undefined): Array<{ value: string; label: string }> {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt) => {
      if (typeof opt === "string" || typeof opt === "number") {
        return { value: String(opt), label: String(opt) };
      }
      if (opt && typeof opt === "object") {
        const o = opt as Record<string, unknown>;
        const value = o.value ?? o.key ?? o.id ?? o.label;
        if (value == null) return null;
        return {
          value: String(value),
          label: String(o.label ?? o.name ?? value),
        };
      }
      return null;
    })
    .filter((x): x is { value: string; label: string } => Boolean(x));
}

export default function AcquireApplyPage() {
  return (
    <Suspense
      fallback={
        <p className="type-sm text-white/70" data-testid="acquire-apply-loading">
          Chargement…
        </p>
      }
    >
      <AcquireApplyInner />
    </Suspense>
  );
}

function AcquireApplyInner() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params.slug;
  const formSlug = search.get("form") ?? search.get("publicSlug") ?? "";

  const [payload, setPayload] = useState<PublicFormPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [website, setWebsite] = useState("");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    challengeToken: string;
    operandA: number;
    operandB: number;
    prompt: string;
  } | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "ok" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const openedAtMs = useRef(Date.now());

  useEffect(() => {
    openedAtMs.current = Date.now();
    setChallengeAnswer("");
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/acquisition-public/challenge");
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: {
            challengeId: string;
            challengeToken: string;
            operandA: number;
            operandB: number;
            prompt: string;
          };
          challengeId?: string;
          challengeToken?: string;
          operandA?: number;
          operandB?: number;
          prompt?: string;
        };
        const data = json.data ?? json;
        if (
          !cancelled &&
          data.challengeId &&
          data.challengeToken &&
          typeof data.operandA === "number" &&
          typeof data.operandB === "number"
        ) {
          setChallenge({
            challengeId: data.challengeId,
            challengeToken: data.challengeToken,
            operandA: data.operandA,
            operandB: data.operandB,
            prompt: data.prompt ?? `Combien font ${data.operandA} + ${data.operandB} ?`,
          });
        }
      } catch {
        /* challenge fetch failure surfaces on submit */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formSlug]);

  useEffect(() => {
    if (!formSlug.trim()) {
      setPayload(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/acquisition-public/forms/${encodeURIComponent(formSlug.trim())}`,
        );
        if (!res.ok) {
          if (!cancelled) setLoadError(`Formulaire indisponible (${res.status})`);
          return;
        }
        const json = (await res.json()) as { data?: PublicFormPayload } & PublicFormPayload;
        const data = (json.data ?? json) as PublicFormPayload;
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Erreur de chargement");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formSlug]);

  const fields = useMemo(() => collectFields(payload), [payload]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const raw = (values[field.key] ?? "").trim();
      const type = (field.type || "text").toLowerCase();
      if (field.required && type === "checkbox") {
        if (raw !== "true" && raw !== "1" && raw !== "on") {
          next[field.key] = "Requis";
        }
        continue;
      }
      if (field.required && !raw) {
        next[field.key] = "Requis";
        continue;
      }
      if (type === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        next[field.key] = "Email invalide";
      }
      if (type === "number" && raw && Number.isNaN(Number(raw))) {
        next[field.key] = "Nombre invalide";
      }
      if (field.pattern && raw) {
        try {
          if (!new RegExp(field.pattern).test(raw)) next[field.key] = "Format invalide";
        } catch {
          /* ignore bad pattern from schema */
        }
      }
    }
    setClientErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitState("idle");
    setSubmitMessage(null);
    if (!validate()) return;

    const email =
      values.email?.trim() ||
      values.Email?.trim() ||
      Object.entries(values).find(([k]) => k.toLowerCase().includes("email"))?.[1]?.trim();

    if (!email) {
      setClientErrors((c) => ({ ...c, email: "Email requis pour la capture lead" }));
      setSubmitMessage(
        "Ajoutez un champ email, ou une adresse email dans le formulaire, pour la capture lead publique.",
      );
      setSubmitState("error");
      return;
    }

    if (!challenge?.challengeId || !challengeAnswer.trim()) {
      setSubmitState("error");
      setSubmitMessage("Répondez au défi anti-bot avant d’envoyer.");
      return;
    }

    try {
      const res = await fetch("/api/acquisition-public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sourceType: "FORM",
          sourceRef: slug,
          formPublicationId: payload?.publication?.id ?? null,
          payload: { ...values, website: website || "" },
          attribution: { productSlug: slug, formSlug: formSlug || null },
          honeypot: website || "",
          submittedAtMs: openedAtMs.current,
          challengeId: challenge.challengeId,
          challengeToken: challenge.challengeToken,
          challengeAnswer: challengeAnswer.trim(),
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      }
      setSubmitState("ok");
      setSubmitMessage(
        "Lead capturé. Une candidature complète (dossier + documents) nécessite le portail authentifié plateforme.",
      );
      void fetch("/api/acquisition-public/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "public.apply.lead_captured",
          properties: { productSlug: slug, formSlug: formSlug || null },
        }),
      }).catch(() => undefined);
    } catch (err) {
      setSubmitState("error");
      setSubmitMessage(err instanceof Error ? err.message : "Échec envoi");
    }
  }

  return (
    <div className="space-y-8" data-testid="acquire-apply">
      <section className="space-y-2 text-white">
        <p
          className="text-sm uppercase tracking-[0.2em] text-white/60"
          style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
        >
          Okapi
        </p>
        <h1 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold">Candidature</h1>
        <p className="max-w-xl type-sm text-white/70">
          Produit <code className="text-white/90">{slug}</code>. Validation côté client
          uniquement pour l&apos;UX — le backend reste la source de vérité.
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        {!formSlug ? (
          <div className="space-y-3 type-sm text-[var(--text-secondary)]">
            <p>
              Ajoutez <code>?form=&lt;publicSlug&gt;</code> pour charger un formulaire
              publié. Sans slug public, seule une capture lead minimale est possible via
              email.
            </p>
            <MinimalLeadForm productSlug={slug} />
          </div>
        ) : null}

        {formSlug && loading ? (
          <p className="type-sm text-[var(--text-muted)]">Chargement du formulaire…</p>
        ) : null}
        {formSlug && loadError ? (
          <p className="type-sm text-[var(--danger)]" role="alert">
            {loadError}
          </p>
        ) : null}

        {formSlug && payload && fields.length > 0 ? (
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            {fields.map((field) => {
              const type = (field.type || "text").toLowerCase();
              const id = `f-${field.key}`;
              const error = clientErrors[field.key];
              const commonLabel = (
                <label className="type-xs text-[var(--text-muted)]" htmlFor={id}>
                  {field.label ?? field.key}
                  {field.required ? " *" : ""}
                </label>
              );

              if (type === "textarea") {
                return (
                  <div key={field.key} className="space-y-1">
                    {commonLabel}
                    <textarea
                      id={id}
                      className="min-h-[6rem] w-full border border-[var(--border)] bg-white px-3 py-2 type-sm"
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.key]: e.target.value }))
                      }
                      required={Boolean(field.required)}
                    />
                    {error ? <p className="type-xs text-[var(--danger)]">{error}</p> : null}
                  </div>
                );
              }

              if (type === "select") {
                const opts = optionLabels(field.options);
                return (
                  <div key={field.key} className="space-y-1">
                    {commonLabel}
                    <select
                      id={id}
                      className="flex h-[var(--control-height)] w-full border border-[var(--border)] bg-white px-3 type-sm"
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.key]: e.target.value }))
                      }
                      required={Boolean(field.required)}
                    >
                      <option value="">—</option>
                      {opts.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {error ? <p className="type-xs text-[var(--danger)]">{error}</p> : null}
                  </div>
                );
              }

              if (type === "checkbox") {
                const checked =
                  values[field.key] === "true" ||
                  values[field.key] === "1" ||
                  values[field.key] === "on";
                return (
                  <div key={field.key} className="flex items-start gap-2">
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [field.key]: e.target.checked ? "true" : "false",
                        }))
                      }
                      required={Boolean(field.required)}
                    />
                    <div>
                      <label className="type-sm text-[var(--text-secondary)]" htmlFor={id}>
                        {field.label ?? field.key}
                        {field.required ? " *" : ""}
                      </label>
                      {error ? (
                        <p className="type-xs text-[var(--danger)]">{error}</p>
                      ) : null}
                    </div>
                  </div>
                );
              }

              const inputType =
                type === "email" ? "email" : type === "number" ? "number" : "text";

              return (
                <div key={field.key} className="space-y-1">
                  {commonLabel}
                  <input
                    id={id}
                    className="flex h-[var(--control-height)] w-full border border-[var(--border)] bg-white px-3 type-sm"
                    type={inputType}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    required={Boolean(field.required)}
                  />
                  {error ? <p className="type-xs text-[var(--danger)]">{error}</p> : null}
                </div>
              );
            })}

            {/* Honeypot — leave empty */}
            <div
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}
            >
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {challenge ? (
              <div className="space-y-1">
                <label className="type-xs text-[var(--text-muted)]" htmlFor="challenge-answer">
                  {challenge.prompt}
                </label>
                <input
                  id="challenge-answer"
                  className="flex h-[var(--control-height)] w-full max-w-[12rem] border border-[var(--border)] bg-white px-3 type-sm"
                  inputMode="numeric"
                  autoComplete="off"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  required
                />
              </div>
            ) : (
              <p className="type-xs text-[var(--text-muted)]">Chargement du défi anti-bot…</p>
            )}

            <button
              type="submit"
              className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-5 type-sm font-medium text-[var(--on-primary)]"
            >
              Envoyer
            </button>
          </form>
        ) : null}

        {formSlug && payload && fields.length === 0 && !loading ? (
          <p className="type-sm text-[var(--text-muted)]">
            Formulaire publié sans champs exploitables dans schemaDefinition.
          </p>
        ) : null}

        {submitMessage ? (
          <p
            className={`mt-4 type-sm ${submitState === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
            role="status"
          >
            {submitMessage}
          </p>
        ) : null}

        <Link
          href={`/acquire/${encodeURIComponent(slug)}`}
          className="mt-6 inline-block type-sm text-[var(--primary)]"
        >
          ← Retour produit
        </Link>
      </section>
    </div>
  );
}

function MinimalLeadForm({ productSlug }: { productSlug: string }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    challengeToken: string;
    prompt: string;
  } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const openedAtMs = useRef(Date.now());

  useEffect(() => {
    openedAtMs.current = Date.now();
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/acquisition-public/challenge");
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: {
            challengeId: string;
            challengeToken: string;
            operandA: number;
            operandB: number;
            prompt?: string;
          };
          challengeId?: string;
          challengeToken?: string;
          operandA?: number;
          operandB?: number;
          prompt?: string;
        };
        const data = json.data ?? json;
        if (!cancelled && data.challengeId && data.challengeToken) {
          setChallenge({
            challengeId: data.challengeId,
            challengeToken: data.challengeToken,
            prompt:
              data.prompt ??
              `Combien font ${data.operandA ?? "?"} + ${data.operandB ?? "?"} ?`,
          });
        }
      } catch {
        /* surfaces on submit */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg("Email invalide");
      return;
    }
    if (!challenge?.challengeId || !challengeAnswer.trim()) {
      setMsg("Répondez au défi anti-bot");
      return;
    }
    try {
      const res = await fetch("/api/acquisition-public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          sourceType: "PUBLIC_LANDING",
          sourceRef: productSlug,
          payload: { productSlug, website: website || "" },
          honeypot: website || "",
          submittedAtMs: openedAtMs.current,
          challengeId: challenge.challengeId,
          challengeToken: challenge.challengeToken,
          challengeAnswer: challengeAnswer.trim(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(
        "Lead capturé. La candidature complète nécessite un compte plateforme authentifié.",
      );
      void fetch("/api/acquisition-public/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "public.apply.lead_captured",
          properties: { productSlug, formSlug: null, mode: "minimal" },
        }),
      }).catch(() => undefined);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <form className="mt-4 max-w-md space-y-3" onSubmit={onSubmit}>
      <label className="type-xs text-[var(--text-muted)]" htmlFor="minimal-email">
        Email
      </label>
      <input
        id="minimal-email"
        type="email"
        className="flex h-[var(--control-height)] w-full border border-[var(--border)] px-3 type-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}
      >
        <label htmlFor="minimal-website">Website</label>
        <input
          id="minimal-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {challenge ? (
        <div className="space-y-1">
          <label className="type-xs text-[var(--text-muted)]" htmlFor="minimal-challenge">
            {challenge.prompt}
          </label>
          <input
            id="minimal-challenge"
            className="flex h-[var(--control-height)] w-full max-w-[12rem] border border-[var(--border)] px-3 type-sm"
            inputMode="numeric"
            autoComplete="off"
            value={challengeAnswer}
            onChange={(e) => setChallengeAnswer(e.target.value)}
            required
          />
        </div>
      ) : null}
      <button
        type="submit"
        className="inline-flex h-[var(--control-height)] items-center bg-[var(--primary)] px-4 type-sm font-medium text-[var(--on-primary)]"
      >
        Capturer le lead
      </button>
      {msg ? <p className="type-sm text-[var(--text-secondary)]">{msg}</p> : null}
    </form>
  );
}
