"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SearchableSelect } from "@/components/settings/searchable-select";
import type { FieldMeta } from "@/lib/settings/field-catalog";
import { withCurrentOption } from "@/lib/settings/options";

function resolveOptions(meta: FieldMeta) {
  const base = meta.getOptions?.() ?? meta.options ?? [];
  return base;
}

export function SettingFieldControl({
  meta,
  value,
  onChange,
}: {
  meta: FieldMeta;
  value: string;
  onChange: (next: string) => void;
}) {
  const options = withCurrentOption(resolveOptions(meta), value || undefined);

  switch (meta.control) {
    case "boolean": {
      const on = value === "true" || value === "1";
      return (
        <Field label={meta.label} hint={meta.hint}>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onChange(on ? "false" : "true")}
            className="flex h-[var(--control-height)] items-center gap-[var(--space-3)]"
          >
            <span
              className={
                on
                  ? "relative h-6 w-10 rounded-[var(--radius-full)] bg-[var(--primary)]"
                  : "relative h-6 w-10 rounded-[var(--radius-full)] bg-[var(--border-strong)]"
              }
            >
              <span
                className={
                  on
                    ? "absolute top-0.5 size-5 translate-x-4 rounded-[var(--radius-full)] bg-[var(--bg-surface)] transition-transform"
                    : "absolute top-0.5 size-5 translate-x-0.5 rounded-[var(--radius-full)] bg-[var(--bg-surface)] transition-transform"
                }
              />
            </span>
            <span className="type-sm text-[var(--text-secondary)]">
              {on ? "On" : "Off"}
            </span>
          </button>
        </Field>
      );
    }

    case "searchable":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <SearchableSelect
            value={value}
            options={options}
            placeholder={meta.placeholder ?? `Search ${meta.label.toLowerCase()}…`}
            onChange={onChange}
          />
        </Field>
      );

    case "select":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Select value={value} onChange={(e) => onChange(e.target.value)}>
            {!value ? <option value="">Select…</option> : null}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      );

    case "multiSelect": {
      const selected = new Set(
        value
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
      return (
        <Field label={meta.label} hint={meta.hint}>
          <div className="grid max-h-56 gap-2 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-2">
            {options.map((o) => {
              const checked = selected.has(o.value);
              return (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]"
                >
                  <input
                    type="checkbox"
                    className="atlas-checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = new Set(selected);
                      if (checked) next.delete(o.value);
                      else next.add(o.value);
                      onChange([...next].join("\n"));
                    }}
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
        </Field>
      );
    }

    case "stringList":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Textarea
            rows={3}
            placeholder={meta.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );

    case "json":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Textarea
            rows={6}
            className="font-mono text-xs"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );

    case "textarea":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Textarea
            rows={4}
            placeholder={meta.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );

    case "color":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0F766E"}
              onChange={(e) => onChange(e.target.value)}
            />
            <Input
              value={value}
              placeholder="#0F766E"
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </Field>
      );

    case "number":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Input
            type="number"
            min={meta.min}
            max={meta.max}
            step={meta.step ?? 1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );

    case "date":
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Input
            type="date"
            value={value.slice(0, 10)}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );

    case "email":
    case "url":
    case "tel":
    case "text":
    default:
      return (
        <Field label={meta.label} hint={meta.hint}>
          <Input
            type={meta.control === "text" ? "text" : meta.control}
            placeholder={meta.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );
  }
}
