import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { HealthStatus } from "@/lib/types";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <div className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: "bg-success",
  watch: "bg-warning",
  critical: "bg-danger",
};

export function StatusDot({
  status,
  pulse = false,
}: {
  status: HealthStatus;
  pulse?: boolean;
}) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && status !== "healthy" ? (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            STATUS_COLOR[status],
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          STATUS_COLOR[status],
        )}
      />
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "accent",
}: {
  value: number;
  max?: number;
  tone?: "accent" | "success" | "warning" | "danger";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const toneClass =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-danger"
          : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", toneClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}
