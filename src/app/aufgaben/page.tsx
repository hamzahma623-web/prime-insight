"use client";

import { useMemo } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { Icon } from "@/lib/icons";
import { cn, relativeDays } from "@/lib/format";
import { useFilters } from "@/components/providers/FilterProvider";
import { tasks } from "@/lib/data/tasks";
import { locationName } from "@/lib/data/locations";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "open", label: "Offen" },
  { status: "in_progress", label: "In Arbeit" },
  { status: "done", label: "Erledigt" },
];

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function AufgabenPage() {
  const { locationId } = useFilters();

  const scoped = useMemo(
    () =>
      tasks.filter((t) => locationId === "all" || t.locationId === locationId),
    [locationId],
  );

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      open: [],
      in_progress: [],
      done: [],
    };
    for (const t of scoped) map[t.status].push(t);
    for (const key of Object.keys(map) as TaskStatus[]) {
      map[key].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      );
    }
    return map;
  }, [scoped]);

  const openCount = byStatus.open.length + byStatus.in_progress.length;
  const criticalCount = scoped.filter(
    (t) => t.priority === "critical" && t.status !== "done",
  ).length;
  const overdue = scoped.filter(
    (t) => t.status !== "done" && new Date(t.due).getTime() < Date.now(),
  ).length;

  return (
    <div>
      <SectionHeading
        eyebrow="Umsetzung"
        title="Aufgaben"
        description="Maßnahmen aus Feedback, Trainer-Ranking und Jarvis-Empfehlungen – zentral nachverfolgt."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Offen & in Arbeit" value={String(openCount)} icon="tasks" />
        <KpiCard
          label="Kritisch"
          value={String(criticalCount)}
          icon="alert"
          tone="danger"
        />
        <KpiCard label="Überfällig" value={String(overdue)} icon="clock" tone={overdue > 0 ? "danger" : "neutral"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.status}>
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {col.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {byStatus[col.status].length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {byStatus[col.status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Keine Aufgaben
                </div>
              ) : (
                byStatus[col.status].map((t) => {
                  const isOverdue =
                    t.status !== "done" &&
                    new Date(t.due).getTime() < Date.now();
                  return (
                    <Card key={t.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <PriorityBadge priority={t.priority} />
                        <span className="text-[11px] text-muted-foreground">
                          {t.category}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-2.5 text-sm font-medium text-foreground",
                          t.status === "done" && "text-muted-foreground line-through",
                        )}
                      >
                        {t.title}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="location" size={13} />
                        {locationName(t.locationId)}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon name="trainer" size={13} />
                          {t.assignee}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            isOverdue ? "text-danger" : "text-muted-foreground",
                          )}
                        >
                          <Icon name="clock" size={13} />
                          {t.status === "done" ? "erledigt" : relativeDays(t.due)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Icon name="sparkle" size={11} className="text-accent" />
                        Quelle: {t.source}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
