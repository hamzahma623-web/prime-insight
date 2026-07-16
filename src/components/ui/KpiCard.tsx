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
      ? "bg-accent-soft text-accent"
      : tone === "danger"
        ? "bg-danger-soft text-danger"
        : "bg-muted text-muted-foreground";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon ? (
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-lg",
                  iconTone,
                )}
              >
                <Icon name={icon} size={15} />
              </span>
            ) : null}
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {unit ? (
              <span className="text-sm font-medium text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>
          {typeof delta === "number" ? (
            <div className="mt-2">
              <Delta value={delta} suffix={deltaSuffix} invert={deltaInvert} />
              <span className="ml-1.5 text-xs text-muted-foreground">
                ggü. Vorperiode
              </span>
            </div>
          ) : null}
        </div>
        {visual ? <div className="shrink-0">{visual}</div> : null}
      </div>
    </Card>
  );
}
