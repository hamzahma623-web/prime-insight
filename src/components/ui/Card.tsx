import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-card)]",
        "border border-border",
        "bg-card text-card-foreground",
        "shadow-[var(--shadow-flat)]",
        "transition-[border-color,box-shadow] duration-200 ease-out",
        "hover:border-foreground/15 hover:shadow-[var(--shadow-raised)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-5 px-6 pt-6",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold tracking-[var(--tracking-tight)] text-foreground">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 pt-5", className)}>{children}</div>;
}