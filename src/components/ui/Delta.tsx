import { Icon } from "@/lib/icons";
import { cn } from "@/lib/format";

// Zeigt eine Veränderung als farbige Pille. `invert` kehrt die Farblogik um
// (z. B. wenn ein Anstieg schlecht ist – etwa bei Beschwerden).
export function Delta({
  value,
  suffix = "%",
  invert = false,
  className,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  className?: string;
}) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const good = invert ? value < 0 : value > 0;

  const tone = isFlat
    ? "text-muted-foreground bg-muted"
    : good
      ? "text-success bg-success-soft"
      : "text-danger bg-danger-soft";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {!isFlat ? (
        <Icon name={isUp ? "arrowUp" : "arrowDown"} size={12} />
      ) : null}
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}
