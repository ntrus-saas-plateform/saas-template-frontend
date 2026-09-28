import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-[var(--radius-sm)] type-sm font-semibold transition-[background-color,opacity,box-shadow] duration-[var(--transition-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-[var(--icon-sm)] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]",
        primary:
          "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]",
        secondary:
          "bg-[var(--secondary)] text-[var(--on-secondary)] hover:opacity-90 active:opacity-[0.82]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-muted)] active:opacity-90",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] active:opacity-90",
        danger:
          "bg-[var(--danger)] text-white hover:opacity-90 active:opacity-[0.82]",
        success:
          "bg-[var(--success)] text-white hover:opacity-90 active:opacity-[0.82]",
        warning:
          "bg-[var(--warning)] text-white hover:opacity-90 active:opacity-[0.82]",
        link: "bg-transparent text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 min-h-8 px-[var(--space-4)]",
        default: "h-[var(--control-height)] min-h-[var(--control-height)] px-[var(--space-4)]",
        md: "h-[var(--control-height)] min-h-[var(--control-height)] px-[var(--space-4)]",
        lg: "h-12 min-h-12 px-[var(--space-4)] type-md",
        xl: "h-14 min-h-14 px-[var(--space-6)] type-md",
        icon: "h-[var(--control-height)] w-[var(--control-height)] min-h-[var(--touch-min)] min-w-[var(--touch-min)] p-0",
        "icon-sm": "h-8 w-8 min-h-8 min-w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? (
          <>
            <LoaderCircle
              className="size-[var(--icon-sm)] animate-spin"
              aria-hidden
            />
            <span>Traitement…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
