import type { ReactNode } from "react";
import {
  cn,
  priorityLabel,
  sentimentLabel,
  statusLabel,
} from "@/lib/format";
import type {
  HealthStatus,
  Priority,
  Sentiment,
  TaskStatus,
} from "@/lib/types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<HealthStatus, Tone> = {
  healthy: "success",
  watch: "warning",
  critical: "danger",
};

export function StatusBadge({ status }: { status: HealthStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{statusLabel[status]}</Badge>;
}

const PRIORITY_TONE: Record<Priority, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{priorityLabel[priority]}</Badge>;
}

const SENTIMENT_TONE: Record<Sentiment, Tone> = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge tone={SENTIMENT_TONE[sentiment]}>{sentimentLabel[sentiment]}</Badge>
  );
}

const TASK_STATUS: Record<TaskStatus, { tone: Tone; label: string }> = {
  open: { tone: "neutral", label: "Offen" },
  in_progress: { tone: "info", label: "In Arbeit" },
  done: { tone: "success", label: "Erledigt" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = TASK_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
