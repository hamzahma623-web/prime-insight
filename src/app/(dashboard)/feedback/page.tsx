"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Stars } from "@/components/ui/Stars";
import { Badge, SentimentBadge } from "@/components/ui/Badge";
import {
  EmptyState,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/Table";
import { cn, formatDateTime } from "@/lib/format";
import { useFilters } from "@/components/providers/FilterProvider";
import type { Sentiment } from "@/lib/types";

type LocationData = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

type ApiFeedback = {
  id: string;
  organization_id: string;
  location_id: string;
  overall_rating: number;
  cleanliness_rating: number | null;
  equipment_rating: number | null;
  atmosphere_rating: number | null;
  staff_rating: number | null;
  comment: string | null;
  improvement_suggestion: string | null;
  wants_contact: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  status: "new" | "reviewed" | "resolved";
  created_at: string;
  locations: LocationData | LocationData[] | null;
};

type TaskPriority = "critical" | "high" | "medium" | "low";

type TaskFormData = {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  assigneeName: string;
  dueDate: string;
};

const SENTIMENT_FILTERS: {
  value: Sentiment | "all";
  label: string;
}[] = [
  { value: "all", label: "Alle" },
  { value: "negative", label: "Negativ" },
  { value: "neutral", label: "Neutral" },
  { value: "positive", label: "Positiv" },
];

const EMPTY_TASK_FORM: TaskFormData = {
  title: "",
  description: "",
  category: "Allgemein",
  priority: "medium",
  assigneeName: "",
  dueDate: "",
};

function getSentiment(rating: number): Sentiment {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

function getLocation(feedback: ApiFeedback): LocationData | null {
  if (Array.isArray(feedback.locations)) {
    return feedback.locations[0] ?? null;
  }

  return feedback.locations;
}

function getMainText(feedback: ApiFeedback): string {
  return (
    feedback.improvement_suggestion ||
    feedback.comment ||
    "Keine schriftliche Rückmeldung."
  );
}

function getCategory(feedback: ApiFeedback): string {
  const ratings = [
    {
      name: "Sauberkeit",
      value: feedback.cleanliness_rating,
    },
    {
      name: "Geräte",
      value: feedback.equipment_rating,
    },
    {
      name: "Atmosphäre",
      value: feedback.atmosphere_rating,
    },
    {
      name: "Freundlichkeit",
      value: feedback.staff_rating,
    },
  ].filter(
    (item): item is { name: string; value: number } =>
      typeof item.value === "number"
  );

  if (ratings.length === 0) {
    return "Allgemein";
  }

  return ratings.sort((a, b) => a.value - b.value)[0].name;
}

function getTags(feedback: ApiFeedback): string[] {
  const tags: string[] = [];

  if (
    feedback.cleanliness_rating !== null &&
    feedback.cleanliness_rating <= 3
  ) {
    tags.push("Sauberkeit");
  }

  if (
    feedback.equipment_rating !== null &&
    feedback.equipment_rating <= 3
  ) {
    tags.push("Geräte");
  }

  if (
    feedback.atmosphere_rating !== null &&
    feedback.atmosphere_rating <= 3
  ) {
    tags.push("Atmosphäre");
  }

  if (
    feedback.staff_rating !== null &&
    feedback.staff_rating <= 3
  ) {
    tags.push("Personal");
  }

  if (feedback.wants_contact) {
    tags.push("Kontakt gewünscht");
  }

  return tags;
}

function getDefaultPriority(rating: number): TaskPriority {
  if (rating === 1) return "critical";
  if (rating === 2) return "high";
  if (rating === 3) return "medium";
  return "low";
}

function getDefaultDueDate(priority: TaskPriority): string {
  const date = new Date();

  const daysToAdd =
    priority === "critical"
      ? 1
      : priority === "high"
        ? 3
        : priority === "medium"
          ? 7
          : 14;

  date.setDate(date.getDate() + daysToAdd);

  return date.toISOString().slice(0, 10);
}

export default function FeedbackPage() {
  const { locationId } = useFilters();

  const [feedback, setFeedback] = useState<ApiFeedback[]>([]);
  const [sentiment, setSentiment] =
    useState<Sentiment | "all">("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedFeedback, setSelectedFeedback] =
    useState<ApiFeedback | null>(null);

  const [taskForm, setTaskForm] =
    useState<TaskFormData>(EMPTY_TASK_FORM);

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskErrorMessage, setTaskErrorMessage] = useState("");

  useEffect(() => {
    async function loadFeedback() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/feedback/list", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error || "Feedback konnte nicht geladen werden."
          );
        }

        setFeedback(result.feedback ?? []);
      } catch (error) {
        console.error("Feedback loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Feedback konnte nicht geladen werden."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadFeedback();
  }, []);

  async function handleStatusChange(
    feedbackId: string,
    newStatus: ApiFeedback["status"]
  ) {
    const previousFeedback = feedback;

    setUpdatingId(feedbackId);
    setErrorMessage("");
    setSuccessMessage("");

    setFeedback((currentFeedback) =>
      currentFeedback.map((item) =>
        item.id === feedbackId
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Status konnte nicht geändert werden."
        );
      }
    } catch (error) {
      console.error("Feedback status update failed:", error);

      setFeedback(previousFeedback);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Status konnte nicht geändert werden."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openTaskDialog(item: ApiFeedback) {
    const category = getCategory(item);
    const priority = getDefaultPriority(item.overall_rating);
    const location = getLocation(item);

    setSelectedFeedback(item);
    setTaskErrorMessage("");
    setSuccessMessage("");

    setTaskForm({
      title: `${category} am Standort ${
        location?.name ?? "prüfen"
      }`,
      description: getMainText(item),
      category,
      priority,
      assigneeName: "",
      dueDate: getDefaultDueDate(priority),
    });
  }

  function closeTaskDialog() {
    if (isCreatingTask) {
      return;
    }

    setSelectedFeedback(null);
    setTaskForm(EMPTY_TASK_FORM);
    setTaskErrorMessage("");
  }

  async function handleCreateTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedFeedback) {
      return;
    }

    const title = taskForm.title.trim();

    if (!title) {
      setTaskErrorMessage("Bitte einen Aufgabentitel eingeben.");
      return;
    }

    setIsCreatingTask(true);
    setTaskErrorMessage("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const dueAt = taskForm.dueDate
        ? new Date(
            `${taskForm.dueDate}T12:00:00`
          ).toISOString()
        : null;

      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: selectedFeedback.location_id,
          feedbackId: selectedFeedback.id,
          title,
          description: taskForm.description.trim() || null,
          priority: taskForm.priority,
          status: "open",
          category: taskForm.category.trim() || "Allgemein",
          assigneeName:
            taskForm.assigneeName.trim() || null,
          source: `Feedback #${selectedFeedback.id.slice(0, 8)}`,
          dueAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Aufgabe konnte nicht erstellt werden."
        );
      }

      setSuccessMessage("Aufgabe wurde erfolgreich erstellt.");
      setSelectedFeedback(null);
      setTaskForm(EMPTY_TASK_FORM);
    } catch (error) {
      console.error("Task creation failed:", error);

      setTaskErrorMessage(
        error instanceof Error
          ? error.message
          : "Aufgabe konnte nicht erstellt werden."
      );
    } finally {
      setIsCreatingTask(false);
    }
  }

  const filtered = useMemo(() => {
    return feedback.filter((item) => {
      const location = getLocation(item);

      const matchesLocation =
        locationId === "all" ||
        item.location_id === locationId ||
        location?.slug === locationId;

      const matchesSentiment =
        sentiment === "all" ||
        getSentiment(item.overall_rating) === sentiment;

      return matchesLocation && matchesSentiment;
    });
  }, [feedback, locationId, sentiment]);

  const counts = useMemo(() => {
    const base = feedback.filter((item) => {
      const location = getLocation(item);

      return (
        locationId === "all" ||
        item.location_id === locationId ||
        location?.slug === locationId
      );
    });

    return {
      total: base.length,
      negative: base.filter(
        (item) =>
          getSentiment(item.overall_rating) === "negative"
      ).length,
      positive: base.filter(
        (item) =>
          getSentiment(item.overall_rating) === "positive"
      ).length,
      average:
        base.reduce(
          (sum, item) => sum + item.overall_rating,
          0
        ) / (base.length || 1),
    };
  }, [feedback, locationId]);

  return (
    <div>
      <SectionHeading
        eyebrow="Stimmen der Mitglieder"
        title="Feedback"
        description="Echte Bewertungen und Kommentare aus dem öffentlichen Feedbackformular."
      />

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Feedbacks"
          value={String(counts.total)}
          icon="feedback"
        />

        <KpiCard
          label="Ø-Bewertung"
          value={counts.average.toFixed(1).replace(".", ",")}
          unit="/ 5"
          icon="star"
        />

        <KpiCard
          label="Negativ"
          value={String(counts.negative)}
          icon="alert"
          tone="danger"
        />

        <KpiCard
          label="Positiv"
          value={String(counts.positive)}
          icon="trend"
          tone="accent"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Feedback-Eingang"
          subtitle={
            isLoading
              ? "Wird geladen …"
              : `${filtered.length} Einträge`
          }
          action={
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {SENTIMENT_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSentiment(filter.value)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    sentiment === filter.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          }
        />

        <div className="mt-2">
          {errorMessage ? (
            <div className="p-5">
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {errorMessage}
              </p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="feedback"
                title="Kein Feedback gefunden"
                description="Für die aktuelle Auswahl liegen keine Einträge vor."
              />
            </div>
          ) : null}

          {!isLoading && !errorMessage && filtered.length > 0 ? (
            <Table>
              <THead>
                <TH>Datum</TH>
                <TH>Standort</TH>
                <TH>Bewertung</TH>
                <TH>Kommentar</TH>
                <TH>Kategorie</TH>
                <TH>Status</TH>
                <TH>Stimmung</TH>
                <TH>Aktion</TH>
              </THead>

              <TBody>
                {filtered.map((item) => {
                  const location = getLocation(item);
                  const tags = getTags(item);
                  const itemSentiment = getSentiment(
                    item.overall_rating
                  );

                  return (
                    <TR key={item.id}>
                      <TD className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </TD>

                      <TD className="whitespace-nowrap text-sm">
                        {location?.name ?? "Unbekannter Standort"}
                      </TD>

                      <TD>
                        <Stars
                          value={item.overall_rating}
                          showValue={false}
                          size={13}
                        />
                      </TD>

                      <TD className="max-w-xs">
                        <p className="line-clamp-2 text-sm text-foreground">
                          {getMainText(item)}
                        </p>

                        {tags.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} tone="neutral">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </TD>

                      <TD className="whitespace-nowrap text-sm">
                        {getCategory(item)}
                      </TD>

                      <TD className="whitespace-nowrap">
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            void handleStatusChange(
                              item.id,
                              event.target
                                .value as ApiFeedback["status"]
                            )
                          }
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="new">Neu</option>
                          <option value="reviewed">
                            Geprüft
                          </option>
                          <option value="resolved">
                            Erledigt
                          </option>
                        </select>
                      </TD>

                      <TD>
                        <SentimentBadge
                          sentiment={itemSentiment}
                        />
                      </TD>

                      <TD className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openTaskDialog(item)}
                          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Aufgabe erstellen
                        </button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          ) : null}
        </div>
      </Card>

      {selectedFeedback ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTaskDialog();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <h2
                  id="create-task-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Aufgabe erstellen
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Die Aufgabe wird mit diesem Feedback verknüpft.
                </p>
              </div>

              <button
                type="button"
                onClick={closeTaskDialog}
                disabled={isCreatingTask}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                Schließen
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="space-y-4 px-6 py-5">
                {taskErrorMessage ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {taskErrorMessage}
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="task-title"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Titel
                  </label>

                  <input
                    id="task-title"
                    type="text"
                    value={taskForm.title}
                    maxLength={250}
                    required
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-description"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Beschreibung
                  </label>

                  <textarea
                    id="task-description"
                    value={taskForm.description}
                    rows={4}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="task-category"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Kategorie
                    </label>

                    <input
                      id="task-category"
                      type="text"
                      value={taskForm.category}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="task-priority"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Priorität
                    </label>

                    <select
                      id="task-priority"
                      value={taskForm.priority}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          priority:
                            event.target.value as TaskPriority,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    >
                      <option value="critical">Kritisch</option>
                      <option value="high">Hoch</option>
                      <option value="medium">Mittel</option>
                      <option value="low">Niedrig</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="task-assignee"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Verantwortlich
                    </label>

                    <input
                      id="task-assignee"
                      type="text"
                      value={taskForm.assigneeName}
                      placeholder="z. B. Facility Team"
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          assigneeName: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="task-due-date"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Fällig am
                    </label>

                    <input
                      id="task-due-date"
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={closeTaskDialog}
                  disabled={isCreatingTask}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Abbrechen
                </button>

                <button
                  type="submit"
                  disabled={isCreatingTask}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingTask
                    ? "Wird erstellt ..."
                    : "Aufgabe erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}