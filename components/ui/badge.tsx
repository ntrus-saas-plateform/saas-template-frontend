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
  variant,
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  /** Legacy alias used by some console pages (`outline` → default). */
  variant?: keyof typeof tones | "outline";
  className?: string;
  title?: string;
}) {
  const resolvedTone: keyof typeof tones =
    tone !== "default"
      ? tone
      : variant && variant !== "outline"
        ? variant
        : "default";
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-1)] type-xs font-medium",
        tones[resolvedTone],
        className,
      )}
    >
      {children}
    </span>
  );
}
