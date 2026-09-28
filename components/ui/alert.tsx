import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  info: {
    icon: Info,
    className: "border-[var(--info)]/30 bg-[var(--info-soft)] text-[var(--info)]",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]",
  },
  error: {
    icon: XCircle,
    className: "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]",
  },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof variants;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const v = variants[tone];
  const Icon = v.icon;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-3)] type-sm",
        v.className,
        className,
      )}
    >
      <Icon className="mt-[2px] size-[var(--icon-sm)] shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-[var(--space-1)]">{children}</div> : null}
      </div>
    </div>
  );
}
