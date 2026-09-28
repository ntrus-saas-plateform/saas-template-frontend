"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "@/components/ui/field-control";
import { AnchoredPopover } from "@/components/ui/anchored-popover";
import {
  filterOptions,
  withCurrentOption,
  type SelectOption,
} from "@/lib/settings/reference-data";

/**
 * Searchable select for large catalogs (countries, currencies, timezones).
 */
export function SearchableSelect({
  id: idProp,
  value,
  onChange,
  options,
  placeholder = "Search…",
  emptyLabel = "No matches",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean | "true" | "false";
}) {
  const genId = useId();
  const id = idProp ?? genId;
  const listId = `${id}-list`;
  const inputId = `${id}-filter`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const all = useMemo(() => withCurrentOption(options, value), [options, value]);
  const filtered = useMemo(() => {
    const next = filterOptions(all, query);
    if (query.trim()) return next;
    if (value && !next.some((o) => o.value === value)) {
      const current = all.find((o) => o.value === value);
      if (current) return [current, ...next];
    }
    return next;
  }, [all, query, value]);
  const selected = all.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    setHighlight(Math.max(0, filtered.findIndex((o) => o.value === value)));
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, filtered]);

  const close = (reason: "escape" | "outside" | "pick") => {
    setOpen(false);
    setQuery("");
    if (reason !== "outside") triggerRef.current?.focus();
  };

  const pick = (next: string) => {
    onChange(next);
    close("pick");
  };

  const activeIndex =
    filtered.length === 0 ? 0 : Math.min(highlight, filtered.length - 1);
  const activeOption = filtered[activeIndex];
  const activeId = activeOption ? `${id}-opt-${activeOption.value}` : undefined;

  const onFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      const item = filtered[activeIndex];
      if (item) pick(item.value);
    } else if (e.key === "Tab") {
      e.preventDefault();
      close("pick");
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        onClick={() => {
          if (open) close("pick");
          else {
            setQuery("");
            setOpen(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setQuery("");
            setOpen(true);
          }
        }}
        className={cn(
          fieldControlClass,
          "flex cursor-pointer items-center justify-between text-left",
          !selected && "text-[var(--text-muted)]",
          className,
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Select…"}</span>
        <ChevronDown
          className={cn(
            "ml-[var(--space-2)] size-[var(--icon-sm)] shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnchoredPopover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        className="overflow-y-auto p-0"
      >
        <input
          ref={inputRef}
          id={inputId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onFilterKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          className="sticky top-0 z-[1] h-[var(--control-height)] w-full shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-3)] type-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="py-1"
          aria-labelledby={id}
        >
          {filtered.length === 0 ? (
            <li className="px-[var(--space-3)] py-[var(--space-2)] type-sm text-[var(--text-muted)]">
              {emptyLabel}
            </li>
          ) : (
            filtered.map((o, i) => {
              const isSelected = o.value === value;
              const isHighlighted = i === activeIndex;
              const showGroup = Boolean(o.group) && o.group !== filtered[i - 1]?.group;
              return (
                <li key={o.value}>
                  {showGroup ? (
                    <p className="px-[var(--space-3)] pb-1 pt-2 type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {o.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    id={`${id}-opt-${o.value}`}
                    role="option"
                    aria-selected={isSelected}
                    data-highlighted={isHighlighted || undefined}
                    className={cn(
                      "flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] text-left type-sm",
                      isHighlighted
                        ? "bg-[var(--primary-soft)] text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
                      isSelected && "font-medium",
                    )}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(o.value)}
                  >
                    <span className="min-w-0 truncate">{o.label}</span>
                    {isSelected ? (
                      <Check
                        className="size-[var(--icon-sm)] shrink-0 text-[var(--primary)]"
                        aria-hidden
                      />
                    ) : null}
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
