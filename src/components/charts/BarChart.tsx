// Horizontales Balkendiagramm für Kategorie-Rankings. Reines SVG.
import { cn } from "@/lib/format";

export interface BarDatum {
  label: string;
  value: number;
  color?: string; // "var(--danger)" etc.
  caption?: string;
}

export function BarChart({
  data,
  max,
  valueFormat = (n) => String(n),
}: {
  data: BarDatum[];
  max?: number;
  valueFormat?: (n: number) => string;
}) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d) => {
        const pct = Math.max(2, (d.value / peak) * 100);
        return (
          <div key={d.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-foreground">
                  {d.label}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {valueFormat(d.value)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full")}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: d.color ?? "var(--accent)",
                  }}
                />
              </div>
              {d.caption ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {d.caption}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
