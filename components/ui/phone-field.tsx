"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "@/components/ui/field-control";
import { AnchoredPopover } from "@/components/ui/anchored-popover";
import { usePreferences } from "@/providers/preferences-provider";
import {
  callingCodeForIso,
  guessDefaultIso,
  listCallingCodes,
  parsePhoneValue,
  toE164,
  type CallingCodeOption,
} from "@/lib/phone/calling-codes";

function emitChange(
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined,
  value: string,
  name?: string,
) {
  if (!onChange) return;
  onChange({
    target: { value, name: name ?? "" },
    currentTarget: { value, name: name ?? "" },
  } as React.ChangeEvent<HTMLInputElement>);
}

function filterCodes(codes: CallingCodeOption[], query: string) {
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  if (!q) return codes;
  return codes.filter((row) => {
    return (
      row.name.toLowerCase().includes(q) ||
      row.iso.toLowerCase().includes(q) ||
      row.dial.startsWith(q) ||
      `+${row.dial}`.includes(q)
    );
  });
}

export function PhoneField({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  readOnly,
  required,
  placeholder,
  autoComplete,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  "aria-label": ariaLabel,
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const genId = useId();
  const fieldId = id ?? genId;
  const listId = `${fieldId}-countries`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { locale, timezone } = usePreferences();
  const fr = locale === "fr";
  const fallbackIso = guessDefaultIso(locale, timezone);
  const raw = String(value ?? defaultValue ?? "");
  const parsed = parsePhoneValue(raw, fallbackIso);

  const [iso, setIso] = useState(parsed.iso);
  const [national, setNational] = useState(parsed.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const next = parsePhoneValue(String(value ?? ""), fallbackIso);
    if (String(value ?? "").trim()) {
      setIso(next.iso);
      setNational(next.national);
    } else if (value === "") {
      setNational("");
    }
  }, [value, fallbackIso]);

  const codes = useMemo(() => listCallingCodes(locale), [locale]);
  const filtered = useMemo(() => {
    const next = filterCodes(codes, query);
    if (query.trim()) {
      return [...next].sort((a, b) => a.name.localeCompare(b.name, locale));
    }
    return next;
  }, [codes, query, locale]);

  const selected = callingCodeForIso(iso) ?? callingCodeForIso(fallbackIso)!;
  const selectedMeta = codes.find((row) => row.iso === iso);

  const close = (reason: "escape" | "outside" | "pick") => {
    setOpen(false);
    setQuery("");
    if (reason !== "outside") triggerRef.current?.focus();
  };

  const commit = (nextIso: string, nextNational: string) => {
    const row = callingCodeForIso(nextIso) ?? selected;
    emitChange(onChange, toE164(row.dial, nextNational), name);
  };

  const pickIso = (nextIso: string) => {
    setIso(nextIso);
    commit(nextIso, national);
    close("pick");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    setHighlight(Math.max(0, filtered.findIndex((row) => row.iso === iso)));
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, filtered]);

  const activeIndex =
    filtered.length === 0 ? 0 : Math.min(highlight, filtered.length - 1);
  const active = filtered[activeIndex];
  const activeId = active ? `${fieldId}-cc-${active.iso}` : undefined;

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(Math.max(0, filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active) pickIso(active.iso);
    } else if (e.key === "Tab") {
      close("pick");
    }
  };

  const onNationalChange = (rawInput: string) => {
    const compact = rawInput.trim();
    if (compact.startsWith("+") || compact.startsWith("00")) {
      const next = parsePhoneValue(compact, iso);
      setIso(next.iso);
      setNational(next.national);
      emitChange(onChange, toE164(next.dial, next.national), name);
      return;
    }
    const nextNational = rawInput.replace(/[^\d\s]/g, "");
    setNational(nextNational);
    commit(iso, nextNational);
  };

  const nationalPlaceholder =
    placeholder && !placeholder.trim().startsWith("+")
      ? placeholder
      : fr
        ? "Numéro"
        : "Number";

  return (
    <div className={cn("flex min-w-0 gap-[var(--space-2)]", className)}>
      {name ? <input type="hidden" name={name} value={raw} /> : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || readOnly}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={fr ? "Indicatif pays" : "Country calling code"}
        onClick={() => {
          if (open) close("pick");
          else setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          fieldControlClass,
          "flex w-[8.25rem] shrink-0 cursor-pointer items-center justify-between gap-1 px-[var(--space-2)]",
        )}
      >
        <span className="min-w-0 truncate type-sm" title={selectedMeta?.name}>
          <span aria-hidden>{selectedMeta?.flag ?? ""}</span>{" "}
          +{selected.dial}
        </span>
        <ChevronDown
          className={cn(
            "size-[var(--icon-sm)] shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <input
        ref={inputRef}
        id={fieldId}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete ?? "tel-national"}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        placeholder={nationalPlaceholder}
        value={national}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired ?? required}
        aria-label={ariaLabel ?? (fr ? "Numéro de téléphone" : "Phone number")}
        onChange={(e) => onNationalChange(e.target.value)}
        className={cn(fieldControlClass, "min-w-0 flex-1")}
      />
      <AnchoredPopover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        minWidth={320}
        maxHeightCap={360}
        className="overflow-y-auto p-0"
      >
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={fr ? "Pays ou indicatif…" : "Country or code…"}
          aria-label={fr ? "Rechercher un pays" : "Search country"}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          className="sticky top-0 z-[1] h-[var(--control-height)] w-full shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-3)] type-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
        <ul ref={listRef} id={listId} role="listbox" className="py-1">
          {filtered.length === 0 ? (
            <li className="px-[var(--space-3)] py-[var(--space-2)] type-sm text-[var(--text-muted)]">
              {fr ? "Aucun pays" : "No matches"}
            </li>
          ) : (
            filtered.map((row, i) => {
              const isSelected = row.iso === iso;
              const isHighlighted = i === activeIndex;
              const showPinned =
                !query.trim() &&
                row.group === "pinned" &&
                filtered[i - 1]?.group !== "pinned";
              const showAll =
                !query.trim() &&
                row.group !== "pinned" &&
                filtered[i - 1]?.group === "pinned";
              return (
                <li key={`${row.iso}-${row.dial}`}>
                  {showPinned ? (
                    <p className="px-[var(--space-3)] pb-1 pt-2 type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {fr ? "Fréquents" : "Frequent"}
                    </p>
                  ) : null}
                  {showAll ? (
                    <p className="px-[var(--space-3)] pb-1 pt-2 type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {fr ? "Tous les pays" : "All countries"}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    id={`${fieldId}-cc-${row.iso}`}
                    role="option"
                    aria-selected={isSelected}
                    data-highlighted={isHighlighted || undefined}
                    className={cn(
                      "flex w-full items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] text-left type-sm",
                      isHighlighted
                        ? "bg-[var(--primary-soft)] text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
                      isSelected && "font-medium",
                    )}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pickIso(row.iso)}
                  >
                    <span className="w-6 shrink-0" aria-hidden>
                      {row.flag}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{row.name}</span>
                    <span className="shrink-0 tabular-nums text-[var(--text-secondary)]">
                      +{row.dial}
                    </span>
                    {isSelected ? (
                      <Check
                        className="size-[var(--icon-sm)] shrink-0 text-[var(--primary)]"
                        aria-hidden
                      />
                    ) : (
                      <span className="size-[var(--icon-sm)] shrink-0" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </AnchoredPopover>
    </div>
  );
}
