"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Stars } from "@/components/ui/Stars";
import { Icon } from "@/lib/icons";
import { useFilters } from "@/components/providers/FilterProvider";

type DashboardSummary = {
  feedbackCount: number;
  avgRating: number;
  positiveCount: number;
  negativeCount: number;
  criticalIssues: number;
  openTaskCount: number;
  criticalTaskCount: number;
  overdueTaskCount: number;
};

type LocationData = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

type DashboardTask = {
  id: string;
  title: string;
  description: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "done";
  due_at: string | null;
  assignee_name: string | null;
  category: string;
  locations: LocationData | null;
};

type DashboardFeedback = {
  id: string;
  overall_rating: number;
  message: string;
  status: string;
  created_at: string;
  locations: LocationData | null;
};

type DashboardResponse = {
  ok: boolean;
  user?: {
    name: string;
    role: string;
  };
  summary?: DashboardSummary;
  recentTasks?: DashboardTask[];
  recentFeedback?: DashboardFeedback[];
  error?: string;
};

const PRIORITY_LABELS: Record<DashboardTask["priority"], string> = {
  critical: "Sofort",
  high: "Wichtig",
  medium: "Normal",
  low: "Niedrig",
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 11) {
    return "Guten Morgen";
  }

  if (hour < 18) {
    return "Guten Tag";
  }

  return "Guten Abend";
}

function formatUserName(name: string) {
  const cleanedName = name
    .replace(/[._-]+/g, " ")
    .trim();

  if (!cleanedName) {
    return "";
  }

  return cleanedName
    .split(" ")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ");
}

function getLocationLabel(location: LocationData | null) {
  if (!location) {
    return "Unbekannter Standort";
  }

  return location.city
    ? `${location.name} · ${location.city}`
    : location.name;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { locationId, locationLabel } = useFilters();

  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/dashboard/summary?locationId=${encodeURIComponent(
            locationId
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result =
          (await response.json()) as DashboardResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "Dashboard konnte nicht geladen werden."
          );
        }

        setData(result);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Dashboard loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Dashboard konnte nicht geladen werden."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      controller.abort();
    };
  }, [locationId]);

  const summary = data?.summary;

  const userName = formatUserName(
    data?.user?.name ?? ""
  );

  const recentTasks = data?.recentTasks ?? [];
  const recentFeedback = data?.recentFeedback ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">
            {locationLabel}
          </p>

          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {getGreeting()}
            {userName ? `, ${userName}` : ""}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Hier siehst du sofort, was heute wichtig ist.
          </p>
        </div>

        <Link
          href="/jarvis"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Icon name="jarvis" size={18} />
          Jarvis fragen
        </Link>
      </section>

      {errorMessage ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Heute wichtig
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Die wichtigsten Zahlen auf einen Blick.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Offene Aufgaben"
            value={
              isLoading
                ? "..."
                : String(summary?.openTaskCount ?? 0)
            }
            icon="tasks"
          />

          <KpiCard
            label="Dringend"
            value={
              isLoading
                ? "..."
                : String(summary?.criticalTaskCount ?? 0)
            }
            icon="alert"
            tone={
              (summary?.criticalTaskCount ?? 0) > 0
                ? "danger"
                : "neutral"
            }
          />

          <KpiCard
            label="Bewertung"
            value={
              isLoading
                ? "..."
                : (summary?.avgRating ?? 0)
                    .toFixed(1)
                    .replace(".", ",")
            }
            unit="/ 5"
            icon="star"
            tone="accent"
          />

          <KpiCard
            label="Feedbacks"
            value={
              isLoading
                ? "..."
                : String(summary?.feedbackCount ?? 0)
            }
            icon="feedback"
          />
        </div>

        {!isLoading &&
        (summary?.overdueTaskCount ?? 0) > 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
            <Icon
              name="clock"
              size={18}
              className="shrink-0 text-danger"
            />

            <p className="text-sm text-foreground">
              <span className="font-semibold">
                {summary?.overdueTaskCount}
              </span>{" "}
              {summary?.overdueTaskCount === 1
                ? "Aufgabe ist überfällig."
                : "Aufgaben sind überfällig."}
            </p>

            <Link
              href="/aufgaben"
              className="ml-auto text-sm font-semibold text-danger hover:underline"
            >
              Ansehen
            </Link>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Das solltest du zuerst erledigen
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Nach Dringlichkeit sortierte Aufgaben.
              </p>
            </div>

            <Link
              href="/aufgaben"
              className="shrink-0 text-sm font-semibold text-accent hover:underline"
            >
              Alle Aufgaben
            </Link>
          </div>

          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aufgaben werden geladen ...
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon name="tasks" size={22} />
                </div>

                <p className="mt-4 font-semibold text-foreground">
                  Alles erledigt
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Aktuell gibt es keine offenen Aufgaben.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={
                          task.priority === "critical"
                            ? "mt-1 h-3 w-3 shrink-0 rounded-full bg-danger"
                            : task.priority === "high"
                              ? "mt-1 h-3 w-3 shrink-0 rounded-full bg-warning"
                              : "mt-1 h-3 w-3 shrink-0 rounded-full bg-accent"
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-foreground">
                            {task.title}
                          </p>

                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>

                        {task.description ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {task.description}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="location" size={13} />
                            {getLocationLabel(task.locations)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="clock" size={13} />
                            {task.due_at
                              ? `Fällig am ${formatDate(
                                  task.due_at
                                )}`
                              : "Keine Frist"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Das sagen deine Mitglieder
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Die neuesten Rückmeldungen.
              </p>
            </div>

            <Link
              href="/feedback"
              className="shrink-0 text-sm font-semibold text-accent hover:underline"
            >
              Alle Feedbacks
            </Link>
          </div>

          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Feedbacks werden geladen ...
              </div>
            ) : recentFeedback.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon name="feedback" size={22} />
                </div>

                <p className="mt-4 font-semibold text-foreground">
                  Noch kein Feedback
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Neue Rückmeldungen erscheinen hier.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentFeedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Stars
                        value={feedback.overall_rating}
                        showValue={false}
                        size={15}
                      />

                      <span className="text-xs text-muted-foreground">
                        {formatDate(feedback.created_at)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-foreground">
                      „{feedback.message}“
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon name="location" size={13} />
                      {getLocationLabel(feedback.locations)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>

      <section>
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name="jarvis" size={23} />
            </span>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Was möchtest du wissen?
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Frag Jarvis nach Problemen, Feedbacks oder
                offenen Aufgaben.
              </p>
            </div>
          </div>

          <Link
            href="/jarvis"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Jarvis öffnen
            <Icon name="chevronRight" size={16} />
          </Link>
        </Card>
      </section>
    </div>
  );
}