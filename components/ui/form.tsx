"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "@/components/ui/field-control";
import { DateField } from "@/components/ui/date-field";
import { PhoneField } from "@/components/ui/phone-field";

export { fieldControlClass };
export { Select } from "@/components/ui/select";
export { DateField, PhoneField };

export function Label({
  children,
  htmlFor,
  required,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-[var(--space-1)] block type-sm font-medium text-[var(--text-secondary)]",
        className,
      )}
    >
      {children}
      {required ? (
        <span className="ml-[var(--space-1)] text-[var(--danger)]" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

export function Input({
  className,
  type,
  "aria-invalid": ariaInvalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  if (type === "date") {
    return (
      <DateField
        className={className}
        aria-invalid={ariaInvalid}
        {...props}
      />
    );
  }
  if (type === "tel") {
    return (
      <PhoneField
        className={className}
        aria-invalid={ariaInvalid}
        {...props}
      />
    );
  }
  return (
    <input
      type={type}
      className={cn(fieldControlClass, className)}
      aria-invalid={ariaInvalid}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        fieldControlClass,
        "h-auto min-h-20 py-[var(--space-2)]",
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({
  className,
  id,
  children,
  compact,
  indeterminate,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  children?: React.ReactNode;
  compact?: boolean;
  indeterminate?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = id ?? (typeof children === "string" ? undefined : id);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-[var(--space-2)]",
        compact
          ? "min-h-0 min-w-0"
          : "min-h-[var(--touch-min)] min-w-[var(--touch-min)]",
        props.disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        ref={inputRef}
        id={generatedId}
        type="checkbox"
        className={cn("atlas-checkbox", className)}
        {...props}
      />
      {children ? (
        <span className="type-base text-[var(--text-primary)]">{children}</span>
      ) : null}
    </label>
  );
}

export function Radio({
  className,
  children,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { children?: React.ReactNode }) {
  return (
    <label className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] cursor-pointer items-center gap-[var(--space-2)]">
      <input
        type="radio"
        className={cn("atlas-radio", className)}
        {...props}
      />
      {children ? (
        <span className="type-base text-[var(--text-primary)]">{children}</span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="flex flex-col">
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <div className="relative">
        {isValidElement(children)
          ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id: fieldId,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": describedBy,
              "aria-required": required || undefined,
            })
          : children}
        {error ? (
          <AlertCircle
            className="pointer-events-none absolute right-[var(--space-3)] top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--danger)]"
            aria-hidden
          />
        ) : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="mt-[var(--space-1)] type-xs text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-[var(--space-1)] type-xs text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
