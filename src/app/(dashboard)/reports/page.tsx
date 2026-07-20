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

function getFeedbackText(feedback: ApiFeedback) {
  return (
    feedback.comment ||
    feedback.message ||
    feedback.feedback_text ||
    feedback.text ||
    ""
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getPeriodStart(timeRange: string) {
  const now = new Date();

  const daysByRange: Record<string, number> = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
    "180d": 180,
    "365d": 365,
  };

  const days = daysByRange[timeRange];

  if (!days) {
    return null;
  }

  const start = new Date(now);
  start.setDate(start.getDate() - days);

  return start;
}

function getPeriodLabel(timeRange: string) {
  const labels: Record<string, string> = {
    "7d": "Letzte 7 Tage",
    "14d": "Letzte 14 Tage",
    "30d": "Letzte 30 Tage",
    "90d": "Letzte 90 Tage",
    "180d": "Letzte 6 Monate",
    "365d": "Letzte 12 Monate",
    all: "Gesamter Zeitraum",
  };

  return labels[timeRange] ?? "Ausgewählter Zeitraum";
}

export default function ReportsPage() {
  const { locationId, timeRange } = useFilters();

  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [feedback, setFeedback] = useState<ApiFeedback[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReportData() {
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

        if (!locationsResponse.ok || !locationsResult.ok) {
          throw new Error(
            locationsResult.error ||
              "Die Standorte konnten nicht geladen werden."
          );
        }

        if (!feedbackResponse.ok || !feedbackResult.ok) {
          throw new Error(
            feedbackResult.error ||
              "Die Rückmeldungen konnten nicht geladen werden."
          );
        }

        if (!tasksResponse.ok || !tasksResult.ok) {
          throw new Error(
            tasksResult.error ||
              "Die Aufgaben konnten nicht geladen werden."
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

        console.error("Reports loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Der Bericht konnte nicht geladen werden."
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

    void loadReportData();

    return () => {
      controller.abort();
    };
  }, []);

  const selectedLocationIds = useMemo(() => {
    if (locationId === "all") {
      return locations.map((location) => location.id);
    }

    const selectedLocation = locations.find(
      (location) =>
        location.id === locationId ||
        location.slug === locationId
    );

    return selectedLocation ? [selectedLocation.id] : [];
  }, [locationId, locations]);

  const selectedLocationName = useMemo(() => {
    if (locationId === "all") {
      return locations.length === 1
        ? locations[0]?.name ?? "Alle Standorte"
        : "Alle Standorte";
    }

    const selectedLocation = locations.find(
      (location) =>
        location.id === locationId ||
        location.slug === locationId
    );

    return selectedLocation?.name ?? "Ausgewählter Standort";
  }, [locationId, locations]);

  const periodStart = useMemo(
    () => getPeriodStart(timeRange),
    [timeRange]
  );

  const filteredFeedback = useMemo(() => {
    return feedback
      .filter((item) =>
        selectedLocationIds.includes(item.location_id)
      )
      .filter((item) => {
        if (!periodStart) {
          return true;
        }

        return new Date(item.created_at) >= periodStart;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }, [feedback, selectedLocationIds, periodStart]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) =>
        selectedLocationIds.includes(task.location_id)
      )
      .filter((task) => {
        if (!periodStart) {
          return true;
        }

        return new Date(task.created_at) >= periodStart;
      });
  }, [tasks, selectedLocationIds, periodStart]);

  const report = useMemo(() => {
    const feedbackCount = filteredFeedback.length;

    const averageRating =
      feedbackCount > 0
        ? filteredFeedback.reduce(
            (sum, item) =>
              sum + Number(item.overall_rating ?? 0),
            0
          ) / feedbackCount
        : 0;

    const positiveFeedback = filteredFeedback.filter(
      (item) => Number(item.overall_rating) >= 4
    ).length;

    const neutralFeedback = filteredFeedback.filter(
      (item) => Number(item.overall_rating) === 3
    ).length;

    const negativeFeedback = filteredFeedback.filter(
      (item) => Number(item.overall_rating) <= 2
    ).length;

    const openTasks = filteredTasks.filter(
      (task) => task.status !== "done"
    );

    const completedTasks = filteredTasks.filter(
      (task) => task.status === "done"
    ).length;

    const urgentTasks = openTasks.filter(
      (task) =>
        task.priority === "critical" ||
        task.priority === "high"
    ).length;

    const overdueTasks = openTasks.filter(
      (task) =>
        task.due_at != null && Date.now() - new Date(task.due_at).getTime() > 0
    ).length;

    return {
      feedbackCount,
      averageRating,
      positiveFeedback,
      neutralFeedback,
      negativeFeedback,
      openTasks: openTasks.length,
      completedTasks,
      urgentTasks,
      overdueTasks,
    };
  }, [filteredFeedback, filteredTasks]);

  const overallStatus = useMemo(() => {
    if (
      report.negativeFeedback > 0 ||
      report.urgentTasks > 0 ||
      report.overdueTasks > 0
    ) {
      return {
        title: "Bitte kurz prüfen",
        description:
          "Es gibt mindestens ein Thema, das deine Aufmerksamkeit benötigt.",
        className: "border-warning/30 bg-warning-soft text-warning",
        dotClassName: "bg-warning",
      };
    }

    if (
      report.feedbackCount > 0 &&
      report.averageRating >= 4
    ) {
      return {
        title: "Alles läuft sehr gut",
        description:
          "Momentan besteht kein unmittelbarer Handlungsbedarf.",
        className: "border-accent/30 bg-accent-soft text-accent",
        dotClassName: "bg-accent",
      };
    }

    if (report.feedbackCount === 0) {
      return {
        title: "Noch nicht genug Rückmeldungen",
        description:
          "Sobald neue Rückmeldungen eingehen, erscheint hier eine Bewertung.",
        className: "border-border bg-muted text-muted-foreground",
        dotClassName: "bg-muted-foreground",
      };
    }

    return {
      title: "Entwicklung beobachten",
      description:
        "Die Ergebnisse sind grundsätzlich stabil, sollten aber weiter beobachtet werden.",
      className: "border-info/30 bg-info-soft text-info",
      dotClassName: "bg-info",
    };
  }, [report]);

  const positivePoints = useMemo(() => {
    const points: string[] = [];

    if (
      report.feedbackCount > 0 &&
      report.averageRating >= 4
    ) {
      points.push("Die durchschnittliche Bewertung ist sehr gut.");
    }

    if (report.negativeFeedback === 0) {
      points.push("Es gibt keine negativen Rückmeldungen.");
    }

    if (report.openTasks === 0) {
      points.push("Aktuell sind alle Aufgaben erledigt.");
    }

    if (report.urgentTasks === 0) {
      points.push("Es gibt keine dringenden offenen Maßnahmen.");
    }

    if (report.overdueTasks === 0) {
      points.push("Es sind keine Aufgaben überfällig.");
    }

    if (points.length === 0) {
      points.push(
        "Neue positive Entwicklungen werden hier automatisch angezeigt."
      );
    }

    return points.slice(0, 4);
  }, [report]);

  const recommendations = useMemo(() => {
    const items: string[] = [];

    if (report.negativeFeedback > 0) {
      items.push(
        `${report.negativeFeedback} ${
          report.negativeFeedback === 1
            ? "kritische Rückmeldung sollte"
            : "kritische Rückmeldungen sollten"
        } geprüft werden.`
      );
    }

    if (report.urgentTasks > 0) {
      items.push(
        `${report.urgentTasks} ${
          report.urgentTasks === 1
            ? "dringende Aufgabe ist"
            : "dringende Aufgaben sind"
        } noch offen.`
      );
    }

    if (report.overdueTasks > 0) {
      items.push(
        `${report.overdueTasks} ${
          report.overdueTasks === 1
            ? "Aufgabe ist"
            : "Aufgaben sind"
        } bereits überfällig.`
      );
    }

    if (
      report.feedbackCount === 0 &&
      items.length === 0
    ) {
      items.push(
        "Aktuell liegen noch keine Rückmeldungen für diesen Zeitraum vor."
      );
    }

    if (items.length === 0) {
      items.push(
        "Momentan sind keine zusätzlichen Maßnahmen erforderlich."
      );
      items.push(
        "Die positive Entwicklung sollte weiter beibehalten werden."
      );
    }

    return items;
  }, [report]);

  return (
    <div>
      <SectionHeading
        eyebrow="Übersicht für die Geschäftsführung"
        title="Standortbericht"
        description={`${selectedLocationName} · ${getPeriodLabel(
          timeRange
        )}`}
      />

      {errorMessage ? (
        <div className="animate-fade mb-6 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="p-5">
                <div className="space-y-3">
                  <span className="skeleton block h-3 w-20" />
                  <span className="skeleton block h-8 w-16" />
                  <span className="skeleton block h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {[0, 1].map((i) => (
              <Card key={i} className="p-6">
                <span className="skeleton block h-6 w-40" />
                <div className="mt-5 space-y-3">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="skeleton block h-12 rounded-[var(--radius-card)]"
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="interactive p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-eyebrow text-muted-foreground">
                    Bewertung
                  </p>

                  <div className="mt-2 flex items-end gap-1">
                    <span className="font-display text-3xl font-semibold tracking-[var(--tracking-tight)] text-foreground tabular-nums">
                      {report.feedbackCount > 0
                        ? report.averageRating
                            .toFixed(1)
                            .replace(".", ",")
                        : "–"}
                    </span>

                    {report.feedbackCount > 0 ? (
                      <span className="pb-1 text-sm text-muted-foreground">
                        von 5
                      </span>
                    ) : null}
                  </div>
                </div>

                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name="feedback" size={18} />
                </span>
              </div>

              {report.feedbackCount > 0 ? (
                <div className="mt-3">
                  <Stars
                    value={report.averageRating}
                    showValue={false}
                    size={15}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Noch keine Bewertung vorhanden
                </p>
              )}
            </Card>

            <Card className="interactive p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-eyebrow text-muted-foreground">
                    Rückmeldungen
                  </p>

                  <p className="mt-2 font-display text-3xl font-semibold tracking-[var(--tracking-tight)] text-foreground tabular-nums">
                    {report.feedbackCount}
                  </p>
                </div>

                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name="feedback" size={18} />
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {report.positiveFeedback} positiv ·{" "}
                {report.neutralFeedback} neutral ·{" "}
                {report.negativeFeedback} negativ
              </p>
            </Card>

            <Card className="interactive p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-eyebrow text-muted-foreground">
                    Offene Aufgaben
                  </p>

                  <p className="mt-2 font-display text-3xl font-semibold tracking-[var(--tracking-tight)] text-foreground tabular-nums">
                    {report.openTasks}
                  </p>
                </div>

                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name="tasks" size={18} />
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {report.urgentTasks} dringend ·{" "}
                {report.overdueTasks} überfällig
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-eyebrow text-muted-foreground">
                Gesamtstatus
              </p>

              <div
                className={`mt-3 rounded-[var(--radius-card)] border p-3 ${overallStatus.className}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${overallStatus.dotClassName}`}
                  />

                  <p className="text-sm font-semibold">
                    {overallStatus.title}
                  </p>
                </div>

                <p className="mt-2 text-xs leading-5">
                  {overallStatus.description}
                </p>
              </div>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-accent/20 bg-accent-soft text-accent">
                  <Icon name="check" size={18} />
                </span>

                <div>
                  <h2 className="font-display text-lg font-semibold tracking-[var(--tracking-tight)] text-foreground">
                    Was läuft gut?
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Die wichtigsten positiven Punkte auf einen Blick.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {positivePoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-muted/25 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent-soft text-accent">
                      <Icon name="check" size={12} />
                    </span>

                    <p className="text-sm leading-6 text-foreground">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name="reports" size={18} />
                </span>

                <div>
                  <h2 className="font-display text-lg font-semibold tracking-[var(--tracking-tight)] text-foreground">
                    Unsere Empfehlung
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Was jetzt als Nächstes sinnvoll ist.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-card)] border border-border bg-muted/25 p-5">
                {recommendations.map((recommendation) => (
                  <div
                    key={recommendation}
                    className="flex items-start gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />

                    <p className="text-sm leading-6 text-foreground">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-5 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-[var(--tracking-tight)] text-foreground">
                  Neueste Rückmeldungen
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Die letzten Stimmen deiner Mitglieder.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                {getPeriodLabel(timeRange)}
              </p>
            </div>

            {filteredFeedback.length === 0 ? (
              <div className="surface mt-5 rounded-[var(--radius-card)] px-5 py-10 text-center">
                <p className="font-semibold text-foreground">
                  Noch keine Rückmeldungen
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Neue Rückmeldungen erscheinen automatisch hier.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-border">
                {filteredFeedback.slice(0, 5).map((item) => {
                  const feedbackText = getFeedbackText(item);

                  return (
                    <div
                      key={item.id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Stars
                            value={Number(item.overall_rating)}
                            showValue={false}
                            size={14}
                          />

                          <p className="mt-3 text-sm leading-6 text-foreground">
                            {feedbackText ||
                              "Für diese Bewertung wurde kein Kommentar hinterlassen."}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}