"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { Icon } from "@/lib/icons";
import { cn, relativeDays } from "@/lib/format";
import { useFilters } from "@/components/providers/FilterProvider";
import type { TaskStatus } from "@/lib/types";

type TaskPriority = "critical" | "high" | "medium" | "low";

type ApiTask = {
  id: string;
  organization_id: string;
  location_id: string;
  feedback_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  assignee_name: string | null;
  source: string;
  due_at: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  locations:
    | {
        id: string;
        name: string;
        slug: string;
        city: string | null;
      }
    | null;
};

type TasksApiResponse = {
  ok: boolean;
  tasks?: ApiTask[];
  error?: string;
};

type TaskUpdateApiResponse = {
  ok: boolean;
  task?: ApiTask;
  error?: string;
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function AufgabenPage() {
  const { locationId } = useFilters();

  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();

        if (locationId) {
          params.set("locationId", locationId);
        }

        const response = await fetch(
          `/api/tasks/list?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = (await response.json()) as TasksApiResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error || "Aufgaben konnten nicht geladen werden."
          );
        }

        setTasks(result.tasks ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Tasks loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Aufgaben konnten nicht geladen werden."
        );

        setTasks([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      controller.abort();
    };
  }, [locationId]);

  async function handleStatusChange(
    taskId: string,
    newStatus: TaskStatus
  ) {
    setUpdatingId(taskId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result =
        (await response.json()) as TaskUpdateApiResponse;

      if (!response.ok || !result.ok || !result.task) {
        throw new Error(
          result.error || "Aufgabe konnte nicht aktualisiert werden."
        );
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...result.task,
                locations: task.locations,
              }
            : task
        )
      );

      setSuccessMessage(
        newStatus === "done"
          ? "Aufgabe wurde als erledigt markiert."
          : newStatus === "in_progress"
            ? "Aufgabe wurde gestartet."
            : "Aufgabe wurde wieder geöffnet."
      );
    } catch (error) {
      console.error("Task status update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Aufgabe konnte nicht aktualisiert werden."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteTask(task: ApiTask) {
    const confirmed = window.confirm(
      `Möchtest du die Aufgabe „${task.title}“ wirklich löschen?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(task.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Aufgabe konnte nicht gelöscht werden."
        );
      }

      setTasks((currentTasks) =>
        currentTasks.filter((item) => item.id !== task.id)
      );

      setSuccessMessage("Aufgabe wurde gelöscht.");
    } catch (error) {
      console.error("Task delete failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Aufgabe konnte nicht gelöscht werden."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, ApiTask[]> = {
      open: [],
      in_progress: [],
      done: [],
    };

    for (const task of tasks) {
      map[task.status].push(task);
    }

    for (const status of Object.keys(map) as TaskStatus[]) {
      map[status].sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
    }

    return map;
  }, [tasks]);

  const openCount =
    byStatus.open.length + byStatus.in_progress.length;

  const criticalCount = tasks.filter(
    (task) =>
      task.priority === "critical" && task.status !== "done"
  ).length;

  const overdueCount = tasks.filter((task) => {
    if (task.status === "done" || !task.due_at) {
      return false;
    }

    return new Date(task.due_at).getTime() < Date.now();
  }).length;

  const visibleColumns: {
    status: TaskStatus;
    label: string;
  }[] = [
    {
      status: "open",
      label: "Offen",
    },
    {
      status: "in_progress",
      label: "In Arbeit",
    },
  ];

  if (showCompleted) {
    visibleColumns.push({
      status: "done",
      label: "Erledigt",
    });
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Deine nächsten Schritte"
        title="Aufgaben"
        description="Hier siehst du sofort, was offen ist und was als Nächstes erledigt werden sollte."
      />

      {successMessage ? (
        <div className="animate-fade mb-4 flex items-center gap-2.5 rounded-[var(--radius-card)] border border-accent/25 bg-accent-soft px-4 py-3 text-sm text-accent">
          <Icon name="check" size={16} className="shrink-0" />
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="animate-fade mb-4 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Noch zu erledigen"
          value={String(openCount)}
          icon="tasks"
          loading={isLoading}
        />

        <KpiCard
          label="Dringend"
          value={String(criticalCount)}
          icon="alert"
          tone="danger"
          loading={isLoading}
        />

        <KpiCard
          label="Überfällig"
          value={String(overdueCount)}
          icon="clock"
          tone={overdueCount > 0 ? "danger" : "neutral"}
          loading={isLoading}
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-[var(--tracking-tight)] text-foreground">
            Aktuelle Aufgaben
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Erledigte Aufgaben werden normalerweise ausgeblendet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCompleted((current) => !current)}
          className="focus-ring interactive shrink-0 rounded-[var(--radius-control)] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          {showCompleted
            ? "Erledigte ausblenden"
            : `Erledigte anzeigen (${byStatus.done.length})`}
        </button>
      </div>

      <div
        className={cn(
          "mt-5 grid gap-5",
          showCompleted ? "lg:grid-cols-3" : "lg:grid-cols-2"
        )}
      >
        {visibleColumns.map((column) => (
          <div key={column.status}>
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="text-sm font-semibold text-foreground">
                {column.label}
              </span>

              <span className="rounded-[var(--radius-pill)] border border-border bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {isLoading ? "–" : byStatus[column.status].length}
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <Card className="p-4">
                  <div className="space-y-3">
                    <span className="skeleton block h-5 w-20 rounded-full" />
                    <span className="skeleton block h-4 w-3/4" />
                    <span className="skeleton block h-3 w-1/2" />
                    <span className="skeleton block h-9 w-full rounded-[var(--radius-control)]" />
                  </div>
                </Card>
              ) : byStatus[column.status].length === 0 ? (
                <div className="surface flex flex-col items-center rounded-[var(--radius-card)] px-4 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                    <Icon
                      name={column.status === "done" ? "check" : "tasks"}
                      size={20}
                    />
                  </span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {column.status === "done"
                      ? "Noch keine erledigten Aufgaben"
                      : "Hier ist aktuell nichts zu tun"}
                  </p>
                </div>
              ) : (
                byStatus[column.status].map((task, index) => {
                  const isBusy =
                    updatingId === task.id ||
                    deletingId === task.id;

                  const isOverdue =
                    task.status !== "done" &&
                    Boolean(task.due_at) &&
                    new Date(task.due_at as string).getTime() 
                      Date.now();

                  const locationLabel = task.locations
                    ? task.locations.city
                      ? `${task.locations.name} · ${task.locations.city}`
                      : task.locations.name
                    : "Unbekannter Standort";

                  return (
                    <Card
                      key={task.id}
                      className="animate-rise p-4"
                      // @ts-expect-error – inline style for stagger
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <PriorityBadge priority={task.priority} />

                        <span className="text-[11px] text-muted-foreground">
                          {task.category}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "mt-2.5 text-sm font-semibold text-foreground",
                          task.status === "done" &&
                            "text-muted-foreground line-through"
                        )}
                      >
                        {task.title}
                      </p>

                      {task.description ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {task.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="location" size={13} />
                        {locationLabel}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon name="trainer" size={13} />
                          {task.assignee_name || "Nicht zugewiesen"}
                        </span>

                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            isOverdue
                              ? "text-danger"
                              : "text-muted-foreground"
                          )}
                        >
                          <Icon name="clock" size={13} />

                          {task.status === "done"
                            ? "Erledigt"
                            : task.due_at
                              ? relativeDays(task.due_at)
                              : "Keine Frist"}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Icon
                          name="sparkle"
                          size={11}
                          className="text-accent"
                        />
                        Quelle: {task.source}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                        {task.status === "open" ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleStatusChange(
                                task.id,
                                "in_progress"
                              )
                            }
                            className="focus-ring interactive rounded-[var(--radius-control)] bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-[#0a0b0d]"
                          >
                            {updatingId === task.id
                              ? "Wird aktualisiert …"
                              : "Starten"}
                          </button>
                        ) : null}

                        {task.status !== "done" ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleStatusChange(
                                task.id,
                                "done"
                              )
                            }
                            className="focus-ring rounded-[var(--radius-control)] border border-accent/30 bg-accent-soft px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/15 disabled:pointer-events-none disabled:opacity-50"
                          >
                            Als erledigt markieren
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleStatusChange(
                                task.id,
                                "open"
                              )
                            }
                            className="focus-ring rounded-[var(--radius-control)] border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                          >
                            Wieder öffnen
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleDeleteTask(task)
                          }
                          className="focus-ring ml-auto rounded-[var(--radius-control)] border border-danger/30 px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger-soft disabled:pointer-events-none disabled:opacity-50"
                        >
                          {deletingId === task.id
                            ? "Wird gelöscht …"
                            : "Löschen"}
                        </button>
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