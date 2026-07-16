import { Icon } from "@/lib/icons";
import { cn } from "@/lib/format";

export function Stars({
  value,
  showValue = true,
  size = 14,
}: {
  value: number;
  showValue?: boolean;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              i < rounded ? "text-warning" : "text-border",
            )}
          >
            <Icon name="star" size={size} />
          </span>
        ))}
      </span>
      {showValue ? (
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {value.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}
