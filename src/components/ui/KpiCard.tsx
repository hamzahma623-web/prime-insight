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
  loading = false,
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
  loading?: boolean;
}) {
  const iconTone =
    tone === "accent"
      ? "border-accent/25 bg-accent-soft text-accent"
      : tone === "danger"
        ? "border-danger/25 bg-danger-soft text-danger"
        : "border-border bg-muted text-muted-foreground";

  const accentBar =
    tone === "accent"
      ? "bg-accent"
      : tone === "danger"
        ? "bg-danger"
        : "bg-border";

  return (
    <Card className="interactive group overflow-hidden p-5">
      {/* dünne Akzentkante oben links – setzt einen ruhigen Fokuspunkt */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-5 h-8 w-[2px] rounded-r-full transition-all duration-300 group-hover:h-10",
          accentBar
        )}
      />

      <div className="flex min-h-[116px] flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-eyebrow text-muted-foreground">
            {label}
          </span>

          {icon ? (
            <span
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border transition-transform duration-300 ease-out group-hover:scale-105",
                iconTone
              )}
            >
              <Icon name={icon} size={16} />
            </span>
          ) : null}
        </div>

        <div>
          <div className="flex items-end gap-1.5">
            {loading ? (
              <span
                aria-hidden="true"
                className="skeleton block h-10 w-20 rounded-lg"
              />
            ) : (
              <>
                <span className="font-display text-[2.75rem] font-semibold leading-none tracking-[var(--tracking-display)] text-foreground tabular-nums">
                  {value}
                </span>
                {unit ? (
                  <span className="pb-1 text-sm font-medium text-muted-foreground">
                    {unit}
                  </span>
                ) : null}
              </>
            )}
          </div>

          {typeof delta === "number" ? (
            loading ? (
              <span
                aria-hidden="true"
                className="skeleton mt-3 block h-4 w-28"
              />
            ) : (
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
            )
          ) : (
            <div className="mt-3 h-5" aria-hidden="true" />
          )}
        </div>

        {visual ? (
          <div className="mt-3 shrink-0">{visual}</div>
        ) : null}
      </div>
    </Card>
  );
}