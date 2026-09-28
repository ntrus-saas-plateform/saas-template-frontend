import { cn } from "@/lib/utils";

const tones = {
  default:
    "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  info: "bg-[var(--info-soft)] text-[var(--info)]",
} as const;

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-1)] type-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
