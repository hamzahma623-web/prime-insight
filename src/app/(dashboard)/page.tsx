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
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-background px-6 py-7 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.28)] sm:px-8 sm:py-9">
  <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-foreground/[0.04] blur-3xl" />

  <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.12)]" />
          Live Übersicht
        </span>

        <span className="text-sm font-medium text-muted-foreground">
          {locationLabel}
        </span>
      </div>

      <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
        {getGreeting()}
        {userName ? `, ${userName}` : ""}
      </h1>

      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        Alle wichtigen Aufgaben, Bewertungen und Rückmeldungen für deinen Standort auf einen Blick.
      </p>
    </div>

    <Link
      href="/jarvis"
      className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_14px_35px_-18px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-20px_rgba(0,0,0,0.7)]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/10 transition-transform duration-300 group-hover:scale-105">
        <Icon name="jarvis" size={17} />
      </span>

      Jarvis fragen

      <Icon
        name="chevronRight"
        size={15}
        className="transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </Link>
  </div>
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
  <Card className="group relative overflow-hidden border-foreground/10 bg-foreground p-0 text-background shadow-[0_28px_80px_-36px_rgba(0,0,0,0.7)]">
    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl transition-transform duration-700 group-hover:scale-110" />

    <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-background/5 blur-3xl" />

    <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-background/10 bg-background/10 text-accent shadow-[0_12px_35px_-18px_hsl(var(--accent)/0.8)] backdrop-blur">
          <Icon name="jarvis" size={25} />
        </span>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-background">
              Was möchtest du wissen?
            </h2>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Bereit
            </span>
          </div>

          <p className="mt-2 max-w-xl text-sm leading-6 text-background/60">
            Frag Jarvis nach Problemen, Feedbacks oder offenen Aufgaben und erhalte sofort eine kompakte Übersicht.
          </p>
        </div>
      </div>

      <Link
        href="/jarvis"
        className="group/button inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-background px-5 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-background/90"
      >
        Jarvis öffnen

        <Icon
          name="chevronRight"
          size={16}
          className="transition-transform duration-300 group-hover/button:translate-x-1"
        />
      </Link>
    </div>
  </Card>
</section>
    </div>
  );
}