"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";

type Challenge = {
  challengeId: string;
  challengeToken: string;
  operandA: number;
  operandB: number;
  prompt: string;
};

/**
 * Public checkout CTA — challenge + email → POST /api/acquisition-public/checkout.
 * Plan must be PUBLISHED; empty catalogue / DRAFT stays fail-closed on the API.
 */
export function AcquirePlanCheckout({
  planPresentationId,
  planTitle,
  ctaLabel,
}: {
  planPresentationId: string;
  planTitle: string;
  ctaLabel?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const openedAtMs = useRef(Date.now());

  useEffect(() => {
    if (!open) return;
    openedAtMs.current = Date.now();
    setAnswer("");
    setError(null);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/acquisition-public/challenge");
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: Challenge;
        } & Partial<Challenge>;
        const data = (json.data ?? json) as Partial<Challenge>;
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
            prompt:
              data.prompt ??
              `Combien font ${data.operandA} + ${data.operandB} ?`,
          });
        }
      } catch {
        /* surfaced on submit */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !challenge) {
      setError("Email et challenge requis.");
      return;
    }
    setPending(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `chk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const res = await fetch("/api/acquisition-public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          idempotencyKey,
          planPresentationId,
          submittedAtMs: openedAtMs.current,
          challengeId: challenge.challengeId,
          challengeToken: challenge.challengeToken,
          challengeAnswer: answer.trim(),
          honeypot: "",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { id?: string };
        id?: string;
        message?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(
          json.error?.message ??
            json.message ??
            `Checkout indisponible (${res.status})`,
        );
        return;
      }
      const id = json.data?.id ?? json.id;
      if (!id) {
        setError("Réponse checkout sans session id.");
        return;
      }
      router.push(`/acquire/checkout/${encodeURIComponent(id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur checkout");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        {ctaLabel?.trim() || `Choisir ${planTitle}`}
      </Button>
    );
  }

  return (
    <form
      className="mt-3 grid max-w-md gap-2 rounded border border-[var(--border)] p-3"
      onSubmit={onSubmit}
      data-testid="acquire-plan-checkout"
    >
      <p className="type-xs text-[var(--text-muted)]">
        Checkout public — pas de carte bancaire stockée ici. Plan PUBLISHED
        requis.
      </p>
      <input
        className={fieldControlClass}
        type="email"
        required
        placeholder="Email professionnel"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      {challenge ? (
        <label className="space-y-1 type-xs text-[var(--text-secondary)]">
          <span>{challenge.prompt}</span>
          <input
            className={fieldControlClass}
            inputMode="numeric"
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            aria-label="Réponse challenge"
          />
        </label>
      ) : (
        <p className="type-xs text-[var(--text-muted)]">
          Chargement du challenge…
        </p>
      )}
      {/* honeypot */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      {error ? (
        <p className="type-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending || !challenge}>
          {pending ? "Création…" : "Démarrer le checkout"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
