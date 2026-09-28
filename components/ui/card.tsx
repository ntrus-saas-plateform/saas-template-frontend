import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "elevation-0 rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-[var(--space-4)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  if (!title && !action) return null;
  return (
    <div
      className={cn(
        "mb-[var(--space-4)] flex items-center justify-between gap-[var(--space-3)]",
        className,
      )}
    >
      {title ? (
        <h2 className="type-md text-[var(--text-primary)]">{title}</h2>
      ) : (
        <span />
      )}
      {action ? <div className="flex items-center gap-[var(--space-2)]">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-[var(--space-4)] border-t border-[var(--border)] pt-[var(--space-4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
