"use client";

import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/format";

interface Option {
  value: string;
  label: string;
}

export function Select({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
  className,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: IconName;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-lg border border-border bg-card text-sm text-foreground",
        "focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      {icon ? (
        <span className="pointer-events-none pl-3 text-muted-foreground">
          <Icon name={icon} size={15} />
        </span>
      ) : null}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 cursor-pointer appearance-none bg-transparent py-1.5 pr-8 font-medium outline-none",
          icon ? "pl-2" : "pl-3",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-muted-foreground">
        <Icon name="chevronDown" size={15} />
      </span>
    </div>
  );
}
