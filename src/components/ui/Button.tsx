import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: [
    "bg-primary text-primary-foreground",
    "shadow-sm",
    "hover:-translate-y-0.5",
    "hover:shadow-lg",
    "active:translate-y-0",
    "active:scale-[0.98]",
    "transition-all duration-200 ease-out",
  ].join(" "),

  accent: [
    "bg-accent text-accent-foreground",
    "shadow-sm",
    "hover:-translate-y-0.5",
    "hover:brightness-110",
    "hover:shadow-lg",
    "active:translate-y-0",
    "active:scale-[0.98]",
    "transition-all duration-200 ease-out",
  ].join(" "),

  secondary: [
    "border border-border",
    "bg-card",
    "text-foreground",
    "hover:bg-muted",
    "hover:border-border/80",
    "hover:-translate-y-0.5",
    "hover:shadow-md",
    "active:translate-y-0",
    "active:scale-[0.98]",
    "transition-all duration-200 ease-out",
  ].join(" "),

  ghost: [
    "text-muted-foreground",
    "hover:bg-muted",
    "hover:text-foreground",
    "transition-all duration-200",
  ].join(" "),
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-xs gap-2 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center",
        "font-medium",
        "select-none",
        "whitespace-nowrap",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-background",
        "disabled:pointer-events-none",
        "disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}