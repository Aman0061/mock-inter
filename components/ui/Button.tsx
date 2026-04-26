import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-indigo-500 focus-visible:ring-primary/60",
  secondary:
    "bg-white/5 text-foreground hover:bg-white/10 focus-visible:ring-white/30",
  ghost:
    "bg-transparent text-foreground hover:bg-white/5 focus-visible:ring-white/20",
};

const BASE_CLASSES =
  "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function buttonClassName(variant: Variant = "primary", extra = "") {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${extra}`.trim();
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className = "", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={buttonClassName(variant, className)}
        {...props}
      />
    );
  }
);
