import { cn } from "@/lib/utils";

export function FormGrid({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "form";
}) {
  return (
    <Tag
      className={cn(
        "grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-12",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function FormSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("col-span-full", className)}>
      {title ? (
        <h2 className="mb-[var(--space-4)] type-lg text-[var(--text-primary)]">
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-12">
        {children}
      </div>
    </section>
  );
}

export function FormFieldset({
  legend,
  children,
  className,
}: {
  legend: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("col-span-full min-w-0 border-0 p-0", className)}>
      <legend className="mb-[var(--space-4)] type-lg text-[var(--text-primary)]">
        {legend}
      </legend>
      <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-12">
        {children}
      </div>
    </fieldset>
  );
}

type Span = 2 | 3 | 4 | 6 | 12;

const spanClass: Record<Span, string> = {
  2: "col-span-full md:col-span-2",
  3: "col-span-full md:col-span-3",
  4: "col-span-full md:col-span-4",
  6: "col-span-full md:col-span-6",
  12: "col-span-full",
};

export function FormCol({
  span = 12,
  children,
  className,
}: {
  span?: Span;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(spanClass[span], className)}>{children}</div>;
}

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 col-span-full mt-[var(--space-5)] flex items-center justify-end gap-[var(--space-2)] border-t border-[var(--border)] bg-[var(--bg-surface)] py-[var(--space-4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
