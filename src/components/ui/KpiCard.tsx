import type { ReactNode } from "react";
import { Card } from "./Card";
import { Delta } from "./Delta";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/format";

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaSuffix,
  deltaInvert,
  icon,
  visual,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaSuffix?: string;
  deltaInvert?: boolean;
  icon?: IconName;
  visual?: ReactNode;
  tone?: "neutral" | "accent" | "danger";
}) {
  const iconTone =
    tone === "accent"
      ? "border-accent/20 bg-accent-soft text-accent shadow-[0_8px_24px_-12px_hsl(var(--accent)/0.8)]"
      : tone === "danger"
        ? "border-danger/20 bg-danger-soft text-danger"
        : "border-border/70 bg-muted/70 text-foreground";

  const glowTone =
    tone === "accent"
      ? "bg-accent/10"
      : tone === "danger"
        ? "bg-danger/10"
        : "bg-foreground/[0.03]";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-5",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-foreground/10",
        "hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.25)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl",
          "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          glowTone,
        )}
      />

      <div className="relative flex min-h-[118px] items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  "transition-transform duration-300 group-hover:scale-105",
                  iconTone,
                )}
              >
                <Icon name={icon} size={17} />
              </span>
            ) : null}

            <span className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </span>
          </div>

          <div className="mt-5 flex items-end gap-1.5">
            <span
              className={cn(
                "font-display text-4xl font-semibold leading-none tracking-[-0.04em]",
                "text-foreground tabular-nums",
                "transition-transform duration-300 group-hover:translate-x-0.5",
              )}
            >
              {value}
            </span>

            {unit ? (
              <span className="pb-0.5 text-sm font-medium text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>

          {typeof delta === "number" ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Delta
                value={delta}
                suffix={deltaSuffix}
                invert={deltaInvert}
              />

              <span className="text-xs text-muted-foreground">
                ggü. Vorperiode
              </span>
            </div>
          ) : (
            <div className="mt-3 h-5" aria-hidden="true" />
          )}
        </div>

        {visual ? (
          <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-[1.02]">
            {visual}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-5 bottom-0 h-px",
          "bg-gradient-to-r from-transparent via-border to-transparent",
          "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        )}
      />
    </Card>
  );
}