import { cn } from "@/lib/utils";

type TabsProps = {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap items-center gap-[var(--space-1)] border-b border-[var(--border)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "-mb-px inline-flex h-[var(--header-height)] items-center gap-[var(--space-2)] border-b-2 px-[var(--space-3)] type-sm transition-colors",
              active
                ? "border-[var(--primary)] font-semibold text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon ? (
              <span className="icon-box-sm" aria-hidden>
                {tab.icon}
              </span>
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
