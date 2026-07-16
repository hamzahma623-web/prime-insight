import type { HealthStatus, Priority, Sentiment, Trend } from "./types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("de-DE").format(n);
}

export function formatSigned(n: number, digits = 1): string {
  const v = n.toFixed(digits);
  return n > 0 ? `+${v}` : v;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relativeDays(iso: string): string {
  const diff = Math.round(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "heute fällig";
  if (diff === 1) return "morgen fällig";
  if (diff === -1) return "gestern überfällig";
  if (diff < 0) return `${Math.abs(diff)} Tage überfällig`;
  return `in ${diff} Tagen`;
}

export const statusLabel: Record<HealthStatus, string> = {
  healthy: "Stabil",
  watch: "Beobachten",
  critical: "Kritisch",
};

export const priorityLabel: Record<Priority, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

export const sentimentLabel: Record<Sentiment, string> = {
  positive: "Positiv",
  neutral: "Neutral",
  negative: "Negativ",
};

export function trendFromDelta(delta: number): Trend {
  if (delta > 0.05) return "up";
  if (delta < -0.05) return "down";
  return "flat";
}
