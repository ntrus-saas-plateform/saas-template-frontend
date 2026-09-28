"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "@/components/ui/field-control";
import { AnchoredPopover } from "@/components/ui/anchored-popover";

export type SelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
};

function optionLabel(children: ReactNode, value: unknown): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map((c) => optionLabel(c, value)).join("");
  }
  return String(value ?? "");
}

export function parseSelectChildren(children: ReactNode): SelectItem[] {
  const items: SelectItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;
    const props = child.props as {
      value?: string | number;
      label?: string;
      disabled?: boolean;
      children?: ReactNode;
    };
    if (type === "optgroup") {
      const group = props.label ?? "";
      Children.forEach(props.children, (opt) => {
        if (!isValidElement(opt) || opt.type !== "option") return;
        const op = opt.props as {
          value?: string | number;
          disabled?: boolean;
          children?: ReactNode;
        };
        const value = String(op.value ?? "");
        items.push({
          value,
          label: optionLabel(op.children, op.value),
          disabled: Boolean(op.disabled),
          group,
        });
      });
      return;
    }
    if (type === "option") {
      const value = String(props.value ?? "");
      items.push({
        value,
        label: optionLabel(props.children, props.value),
        disabled: Boolean(props.disabled),
      });
    }
  });
  return items;
}

function emitChange(
  onChange: React.ChangeEventHandler<HTMLSelectElement> | undefined,
  value: string,
  name?: string,
) {
  if (!onChange) return;
  onChange({
    target: { value, name: name ?? "" },
    currentTarget: { value, name: name ?? "" },
  } as React.ChangeEvent<HTMLSelectElement>);
}

export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  name,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  "aria-label": ariaLabel,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const genId = useId();
  const fieldId = id ?? genId;
  const listId = `${fieldId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const options = useMemo(() => parseSelectChildren(children), [children]);
  const current = value !== undefined ? String(value) : String(defaultValue ?? "");
  const selected = options.find((o) => o.value === current);
  const enabledIndexes = options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const close = (reason: "escape" | "outside" | "pick") => {
    setOpen(false);
    if (reason !== "outside") triggerRef.current?.focus();
  };

  const pick = (next: string) => {
    emitChange(onChange, next, name);
    close("pick");
  };

  const activeIndex =
    options.length === 0 ? 0 : Math.min(highlight, options.length - 1);
  const active = options[activeIndex];
  const activeId = active ? `${fieldId}-opt-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === current && !o.disabled);
    setHighlight(idx >= 0 ? idx : (enabledIndexes[0] ?? 0));
    const frame = window.requestAnimationFrame(() => listRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const move = (dir: 1 | -1) => {
    if (!enabledIndexes.length) return;
    const pos = enabledIndexes.indexOf(activeIndex);
    const next =
      enabledIndexes[
        Math.min(
          enabledIndexes.length - 1,
          Math.max(0, (pos < 0 ? 0 : pos) + dir),
        )
      ]!;
    setHighlight(next);
  };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (enabledIndexes[0] != null) setHighlight(enabledIndexes[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = enabledIndexes[enabledIndexes.length - 1];
      if (last != null) setHighlight(last);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = options[activeIndex];
      if (item && !item.disabled) pick(item.value);
    } else if (e.key === "Tab") {
      e.preventDefault();
      close("pick");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const q = e.key.toLowerCase();
      const i = options.findIndex(
        (o) => !o.disabled && o.label.toLowerCase().startsWith(q),
      );
      if (i >= 0) setHighlight(i);
    }
  };

  const empty = !selected || selected.value === "";

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired ?? required}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          fieldControlClass,
          "flex cursor-pointer items-center justify-between gap-[var(--space-2)] text-left",
          empty && "text-[var(--text-muted)]",
          className,
        )}
      >
        <span className="min-w-0 truncate">
          {selected?.label || "Select…"}
        </span>
        <ChevronDown
          className={cn(
            "size-[var(--icon-sm)] shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnchoredPopover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        className="p-[var(--space-1)]"
      >
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={fieldId}
          aria-activedescendant={activeId}
          onKeyDown={onListKeyDown}
          className="outline-none"
        >
          {options.map((o, i) => {
            const isSelected = o.value === current;
            const isHighlighted = i === activeIndex;
            const showGroup = Boolean(o.group) && o.group !== options[i - 1]?.group;
            return (
              <li key={`${o.group ?? ""}-${o.value}-${i}`}>
                {showGroup ? (
                  <p className="px-[var(--space-3)] pb-1 pt-2 type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {o.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  id={`${fieldId}-opt-${i}`}
                  role="option"
                  disabled={o.disabled}
                  aria-selected={isSelected}
                  data-highlighted={isHighlighted || undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)] text-left type-sm",
                    o.disabled && "cursor-not-allowed opacity-40",
                    isHighlighted && !o.disabled
                      ? "bg-[var(--primary-soft)] text-[var(--text-primary)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
                    isSelected && "font-medium",
                  )}
                  onMouseEnter={() => {
                    if (!o.disabled) setHighlight(i);
                  }}
                  onClick={() => {
                    if (!o.disabled) pick(o.value);
                  }}
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
          })}
        </ul>
      </AnchoredPopover>
    </div>
  );
}
