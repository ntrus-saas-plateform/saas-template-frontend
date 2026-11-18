"use client";

import { fieldControlClass } from "@/components/ui/field-control";

/**
 * Select from a loaded list when options exist; UUID/text paste fallback when empty.
 */
export function ListOrUuidField({
  value,
  onChange,
  options,
  placeholder,
  fallbackPlaceholder,
  required,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  fallbackPlaceholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const controlClass = [fieldControlClass, className].filter(Boolean).join(" ");
  if (options.length > 0) {
    return (
      <select
        id={id}
        aria-label={ariaLabel}
        className={controlClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      className={controlClass}
      placeholder={fallbackPlaceholder ?? placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );
}
