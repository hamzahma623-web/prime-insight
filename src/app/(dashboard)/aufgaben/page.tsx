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
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Noch zu erledigen"
          value={isLoading ? "..." : String(openCount)}
          icon="tasks"
        />

        <KpiCard
          label="Dringend"
          value={isLoading ? "..." : String(criticalCount)}
          icon="alert"
          tone="danger"
        />

        <KpiCard
          label="Überfällig"
          value={isLoading ? "..." : String(overdueCount)}
          icon="clock"
          tone={overdueCount > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Aktuelle Aufgaben
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Erledigte Aufgaben werden normalerweise ausgeblendet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCompleted((current) => !current)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {showCompleted
            ? "Erledigte ausblenden"
            : `Erledigte anzeigen (${byStatus.done.length})`}
        </button>
      </div>

      <div
        className={cn(
          "mt-4 grid gap-4",
          showCompleted ? "lg:grid-cols-3" : "lg:grid-cols-2"
        )}
      >
        {visibleColumns.map((column) => (
          <div key={column.status}>
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="text-sm font-semibold text-foreground">
                {column.label}
              </span>

              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {isLoading
                  ? "..."
                  : byStatus[column.status].length}
              </span>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Aufgaben werden geladen ...
                </div>
              ) : byStatus[column.status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {column.status === "done"
                    ? "Noch keine erledigten Aufgaben"
                    : "Hier ist aktuell nichts zu tun"}
                </div>
              ) : (
                byStatus[column.status].map((task) => {
                  const isBusy =
                    updatingId === task.id ||
                    deletingId === task.id;

                  const isOverdue =
                    task.status !== "done" &&
                    Boolean(task.due_at) &&
                    new Date(task.due_at as string).getTime() <
                      Date.now();

                  const locationLabel = task.locations
                    ? task.locations.city
                      ? `${task.locations.name} · ${task.locations.city}`
                      : task.locations.name
                    : "Unbekannter Standort";

                  return (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <PriorityBadge priority={task.priority} />

                        <span className="text-[11px] text-muted-foreground">
                          {task.category}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "mt-2.5 text-sm font-medium text-foreground",
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
                            className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === task.id
                              ? "Wird aktualisiert ..."
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
                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="ml-auto rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === task.id
                            ? "Wird gelöscht ..."
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