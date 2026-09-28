"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "@/components/ui/field-control";
import { AnchoredPopover } from "@/components/ui/anchored-popover";
import { usePreferences } from "@/providers/preferences-provider";

const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_MON_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m! - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const weekday = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(first);
  start.setDate(first.getDate() - weekday);
  return start;
}

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

export function DateField({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  min,
  max,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  "aria-label": ariaLabel,
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const genId = useId();
  const fieldId = id ?? genId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const current = String(value ?? defaultValue ?? "").slice(0, 10);
  const selected = parseIso(current);
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const { locale: loc } = usePreferences();
  const fr = loc === "fr";
  const locale = fr ? "fr-FR" : "en-GB";

  const initial = selected ?? today;
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  useEffect(() => {
    if (!open) return;
    const base = selected ?? today;
    setCursor({ year: base.getFullYear(), month: base.getMonth() });
  }, [open, selected, today]);

  const close = (reason: "escape" | "outside" | "pick") => {
    setOpen(false);
    if (reason !== "outside") triggerRef.current?.focus();
  };

  const pick = (iso: string) => {
    emitChange(onChange, iso, name);
    close("pick");
  };

  const clear = () => {
    emitChange(onChange, "", name);
  };

  const minDate = typeof min === "string" ? parseIso(min) : null;
  const maxDate = typeof max === "string" ? parseIso(max) : null;
  const weekdays = fr ? WEEKDAYS_MON_FR : WEEKDAYS_MON;

  const cells = useMemo(() => {
    const start = startOfGrid(cursor.year, cursor.month);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [cursor.year, cursor.month]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(cursor.year, cursor.month, 1));

  const display = selected
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(selected)
    : fr
      ? "Choisir une date"
      : "Pick a date";

  const shiftMonth = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired ?? required}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          fieldControlClass,
          "flex cursor-pointer items-center gap-[var(--space-2)] text-left",
          !selected && "text-[var(--text-muted)]",
          className,
        )}
      >
        <CalendarDays
          className="size-[var(--icon-sm)] shrink-0 text-[var(--text-muted)]"
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{display}</span>
        {selected && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label={fr ? "Effacer la date" : "Clear date"}
            className="rounded-[var(--radius-sm)] p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clear();
            }}
          >
            <X className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </button>
      <AnchoredPopover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        className="w-[280px] p-[var(--space-3)]"
      >
        <div className="mb-[var(--space-2)] flex items-center justify-between gap-[var(--space-2)]">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            aria-label={fr ? "Mois précédent" : "Previous month"}
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="type-sm font-semibold capitalize text-[var(--text-primary)]">
            {monthLabel}
          </p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            aria-label={fr ? "Mois suivant" : "Next month"}
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {weekdays.map((d) => (
            <span
              key={d}
              className="py-1 text-center type-xs font-semibold text-[var(--text-muted)]"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date) => {
            const iso = toIso(date);
            const inMonth = date.getMonth() === cursor.month;
            const isSel = selected ? toIso(selected) === iso : false;
            const isToday = toIso(today) === iso;
            const blocked = isDisabled(date);
            return (
              <button
                key={iso}
                type="button"
                disabled={blocked}
                aria-pressed={isSel}
                onClick={() => pick(iso)}
                className={cn(
                  "flex h-8 items-center justify-center rounded-[var(--radius-sm)] type-sm",
                  !inMonth && "text-[var(--text-muted)]",
                  inMonth && !isSel && "text-[var(--text-primary)]",
                  isToday && !isSel && "font-semibold ring-1 ring-[var(--border-strong)]",
                  isSel && "bg-[var(--primary)] font-semibold text-[var(--on-primary)]",
                  !isSel && !blocked && "hover:bg-[var(--surface-muted)]",
                  blocked && "cursor-not-allowed opacity-30",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className="mt-[var(--space-2)] flex justify-between border-t border-[var(--border)] pt-[var(--space-2)]">
          <button
            type="button"
            className="type-xs font-semibold text-[var(--primary)] hover:underline"
            onClick={() => pick(toIso(today))}
          >
            {fr ? "Aujourd'hui" : "Today"}
          </button>
          <button
            type="button"
            className="type-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={() => {
              clear();
              close("pick");
            }}
          >
            {fr ? "Effacer" : "Clear"}
          </button>
        </div>
      </AnchoredPopover>
    </div>
  );
}
