"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { Icon } from "@/lib/icons";
import { useFilters } from "@/components/providers/FilterProvider";

type ApiLocation = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  is_active: boolean;
};

type ApiFeedback = {
  id: string;
  location_id: string;
  overall_rating: number;
  status: string;
  created_at: string;
  comment?: string | null;
  message?: string | null;
  feedback_text?: string | null;
  text?: string | null;
};

type ApiTask = {
  id: string;
  location_id: string;
  title?: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "done";
  due_at: string | null;
  created_at: string;
};

type LocationsResponse = {
  ok: boolean;
  locations?: ApiLocation[];
  error?: string;
};

type FeedbackResponse = {
  ok: boolean;
  feedback?: ApiFeedback[];
  error?: string;
};

type TasksResponse = {
  ok: boolean;
  tasks?: ApiTask[];
  error?: string;
};

type LocationSummary = {
  location: ApiLocation;
  feedbackCount: number;
  avgRating: number;
  positiveCount: number;
  negativeCount: number;
  criticalIssues: number;
  openTasks: number;
  criticalTasks: number;
  overdueTasks: number;
};

function getStatus(summary: LocationSummary) {
  if (
    summary.criticalIssues > 0 ||
    summary.criticalTasks > 0 ||
    summary.overdueTasks > 0
  ) {
    return {
      label: "Handlungsbedarf",
      className: "border-danger/30 bg-danger-soft text-danger",
      dotClassName: "bg-danger",
    };
  }

  if (
    summary.feedbackCount > 0 &&
    summary.avgRating < 4
  ) {
    return {
      label: "Beobachten",
      className: "border-warning/30 bg-warning-soft text-warning",
      dotClassName: "bg-warning",
    };
  }

  return {
    label: "Alles im grünen Bereich",
    className: "border-accent/30 bg-accent-soft text-accent",
    dotClassName: "bg-accent",
  };
}

export default function StandortePage() {
  const { locationId } = useFilters();

  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [feedback, setFeedback] = useState<ApiFeedback[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          locationsResponse,
          feedbackResponse,
          tasksResponse,
        ] = await Promise.all([
          fetch("/api/locations/list", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/feedback/list", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/tasks/list?locationId=all", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const locationsResult =
          (await locationsResponse.json()) as LocationsResponse;

        const feedbackResult =
          (await feedbackResponse.json()) as FeedbackResponse;

        const tasksResult =
          (await tasksResponse.json()) as TasksResponse;

        if (
          !locationsResponse.ok ||
          !locationsResult.ok
        ) {
          throw new Error(
            locationsResult.error ||
              "Standorte konnten nicht geladen werden."
          );
        }

        if (
          !feedbackResponse.ok ||
          !feedbackResult.ok
        ) {
          throw new Error(
            feedbackResult.error ||
              "Feedbacks konnten nicht geladen werden."
          );
        }

        if (!tasksResponse.ok || !tasksResult.ok) {
          throw new Error(
            tasksResult.error ||
              "Aufgaben konnten nicht geladen werden."
          );
        }

        setLocations(locationsResult.locations ?? []);
        setFeedback(feedbackResult.feedback ?? []);
        setTasks(tasksResult.tasks ?? []);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Location page loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Standortdaten konnten nicht geladen werden."
        );

        setLocations([]);
        setFeedback([]);
        setTasks([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      controller.abort();
    };
  }, []);

  const summaries = useMemo<LocationSummary[]>(() => {
    return locations.map((location) => {
      const locationFeedback = feedback.filter(
        (item) => item.location_id === location.id
      );

      const locationTasks = tasks.filter(
        (task) => task.location_id === location.id
      );

      const feedbackCount = locationFeedback.length;

      const avgRating =
        feedbackCount > 0
          ? locationFeedback.reduce(
              (sum, item) =>
                sum + Number(item.overall_rating ?? 0),
              0
            ) / feedbackCount
          : 0;

      const positiveCount = locationFeedback.filter(
        (item) =>
          Number(item.overall_rating) >= 4
      ).length;

      const negativeCount = locationFeedback.filter(
        (item) =>
          Number(item.overall_rating) <= 2
      ).length;

      const criticalIssues = locationFeedback.filter(
        (item) =>
          Number(item.overall_rating) <= 2 &&
          item.status !== "resolved"
      ).length;

      const openLocationTasks = locationTasks.filter(
        (task) => task.status !== "done"
      );

      const openTasks = openLocationTasks.length;

      const criticalTasks = openLocationTasks.filter(
        (task) => task.priority === "critical"
      ).length;

      const overdueTasks = openLocationTasks.filter(
        (task) =>
          task.due_at != null && Date.now() - new Date(task.due_at).getTime() > 0
      ).length;

      return {
        location,
        feedbackCount,
        avgRating,
        positiveCount,
        negativeCount,
        criticalIssues,
        openTasks,
        criticalTasks,
        overdueTasks,
      };
    });
  }, [locations, feedback, tasks]);

  const visibleSummaries = useMemo(() => {
    if (locationId === "all") {
      return summaries;
    }

    return summaries.filter(
      (summary) =>
        summary.location.slug === locationId ||
        summary.location.id === locationId
    );
  }, [summaries, locationId]);

  return (
    <div>
      <SectionHeading
        eyebrow={
          isLoading
            ? "Standorte werden geladen"
            : `${visibleSummaries.length} ${
                visibleSummaries.length === 1
                  ? "Standort"
                  : "Standorte"
              }`
        }
        title="Standorte"
        description="Hier siehst du die wichtigsten Zahlen je Standort."
      />

      {errorMessage ? (
        <div className="animate-fade mb-6 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="skeleton block h-6 w-48" />
                  <span className="skeleton block h-4 w-24" />
                </div>
                <span className="skeleton h-7 w-32 rounded-[var(--radius-pill)]" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className="surface space-y-3 rounded-[var(--radius-card)] p-4"
                  >
                    <span className="skeleton block h-3 w-16" />
                    <span className="skeleton block h-8 w-14" />
                    <span className="skeleton block h-3 w-20" />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[0, 1].map((k) => (
                  <span
                    key={k}
                    className="skeleton h-16 rounded-[var(--radius-card)]"
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : visibleSummaries.length === 0 ? (
        <div className="surface flex flex-col items-center rounded-[var(--radius-surface)] px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-card)] border border-border bg-muted text-muted-foreground">
            <Icon name="location" size={24} />
          </span>

          <p className="mt-4 font-semibold text-foreground">
            Kein Standort gefunden
          </p>

          <p className="mt-1.5 text-sm text-muted-foreground">
            Für diesen Filter gibt es keinen verfügbaren Standort.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {visibleSummaries.map((summary, index) => {
            const status = getStatus(summary);

            return (
              <Card
                key={summary.location.id}
                className="animate-rise interactive p-6"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                        <span
                          className={`absolute inline-flex h-2.5 w-2.5 animate-ping-slow rounded-full opacity-60 ${status.dotClassName}`}
                        />
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${status.dotClassName}`}
                        />
                      </span>

                      <h2 className="font-display text-xl font-semibold tracking-[var(--tracking-tight)] text-foreground">
                        {summary.location.name}
                      </h2>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {summary.location.city ||
                        "Ort nicht hinterlegt"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="surface rounded-[var(--radius-card)] p-4">
                    <p className="text-eyebrow text-muted-foreground">
                      Bewertung
                    </p>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-semibold tracking-[var(--tracking-tight)] text-foreground tabular-nums">
                        {summary.feedbackCount > 0
                          ? summary.avgRating
                              .toFixed(1)
                              .replace(".", ",")
                          : "–"}
                      </span>

                      {summary.feedbackCount > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          / 5
                        </span>
                      ) : null}
                    </div>

                    {summary.feedbackCount > 0 ? (
                      <div className="mt-2">
                        <Stars
                          value={summary.avgRating}
                          showValue={false}
                          size={13}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Noch keine Bewertung
                      </p>
                    )}
                  </div>

                  <div className="surface rounded-[var(--radius-card)] p-4">
                    <p className="text-eyebrow text-muted-foreground">
                      Feedbacks
                    </p>

                    <p className="mt-2 font-display text-3xl font-semibold tracking-[var(--tracking-tight)] text-foreground tabular-nums">
                      {summary.feedbackCount}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {summary.positiveCount} positiv ·{" "}
                      {summary.negativeCount} negativ
                    </p>
                  </div>

                  <div className="surface rounded-[var(--radius-card)] p-4">
                    <p className="text-eyebrow text-muted-foreground">
                      Offene Aufgaben
                    </p>

                    <p className="mt-2 font-display text-3xl font-semibold tracking-[var(--tracking-tight)] text-foreground tabular-nums">
                      {summary.openTasks}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {summary.criticalTasks} dringend ·{" "}
                      {summary.overdueTasks} überfällig
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                      <Icon name="feedback" size={17} />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Kritische Rückmeldungen
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {summary.criticalIssues === 0
                          ? "Keine offenen kritischen Themen"
                          : `${summary.criticalIssues} offene kritische ${
                              summary.criticalIssues === 1
                                ? "Rückmeldung"
                                : "Rückmeldungen"
                            }`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                      <Icon name="tasks" size={17} />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Aktueller Arbeitsstand
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {summary.openTasks === 0
                          ? "Aktuell ist alles erledigt"
                          : `${summary.openTasks} ${
                              summary.openTasks === 1
                                ? "Aufgabe ist"
                                : "Aufgaben sind"
                            } noch offen`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}