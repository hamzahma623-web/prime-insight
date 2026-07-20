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

function getPriorityDot(priority: DashboardTask["priority"]) {
  if (priority === "critical") {
    return "bg-danger";
  }

  if (priority === "high") {
    return "bg-warning";
  }

  return "bg-accent";
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
    <div className="space-y-10">
      {/* Hero – Control-Center-Kopf */}
      <section
        className="animate-rise relative overflow-hidden rounded-[var(--radius-surface)] border border-border p-6 sm:p-9"
        style={{
          backgroundImage:
            "linear-gradient(180deg, color-mix(in srgb, #ffffff 4%, var(--card)), var(--card))",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* ein einziger, sehr dezenter Lichtakzent für Tiefe */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-accent/20 bg-accent-soft px-3 py-1 text-eyebrow text-accent">
                <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                  <span className="absolute inline-flex h-1.5 w-1.5 animate-ping-slow rounded-full bg-accent/60" />
                  <span className="relative inline-flex h-1 w-1 rounded-full bg-accent" />
                </span>
                Live Übersicht
              </span>

              <span className="text-sm font-medium text-muted-foreground">
                {locationLabel}
              </span>
            </div>

            <h1 className="text-gradient mt-6 font-display text-4xl font-semibold tracking-[var(--tracking-display)] sm:text-5xl">
              {getGreeting()}
              {userName ? `, ${userName}` : ""}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Alle wichtigen Aufgaben, Bewertungen und Rückmeldungen für deinen Standort — an einem Ort, in Echtzeit.
            </p>
          </div>

          <Link
            href="/jarvis"
            className="focus-ring interactive group inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)] dark:bg-white dark:text-[#0a0b0d]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/10 text-accent dark:bg-black/5">
              <Icon name="jarvis" size={16} />
            </span>
            Jarvis fragen
            <Icon
              name="chevronRight"
              size={15}
              className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <div className="animate-fade rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      {/* KPI-Zone */}
      <section className="animate-fade" style={{ animationDelay: "80ms" }}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[var(--tracking-tight)] text-foreground">
              Heute wichtig
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Die wichtigsten Kennzahlen auf einen Blick.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Offene Aufgaben"
            value={String(summary?.openTaskCount ?? 0)}
            icon="tasks"
            loading={isLoading}
          />

          <KpiCard
            label="Dringend"
            value={String(summary?.criticalTaskCount ?? 0)}
            icon="alert"
            tone={
              (summary?.criticalTaskCount ?? 0) > 0
                ? "danger"
                : "neutral"
            }
            loading={isLoading}
          />

          <KpiCard
            label="Bewertung"
            value={(summary?.avgRating ?? 0)
              .toFixed(1)
              .replace(".", ",")}
            unit="/ 5"
            icon="star"
            tone="accent"
            loading={isLoading}
          />

          <KpiCard
            label="Feedbacks"
            value={String(summary?.feedbackCount ?? 0)}
            icon="feedback"
            loading={isLoading}
          />
        </div>

        {!isLoading &&
        (summary?.overdueTaskCount ?? 0) > 0 ? (
          <div className="animate-fade mt-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-danger/25 bg-danger-soft px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-danger/25 text-danger">
              <Icon name="clock" size={16} />
            </span>

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
              className="focus-ring ml-auto rounded text-sm font-semibold text-danger hover:underline"
            >
              Ansehen
            </Link>
          </div>
        ) : null}
      </section>

      {/* Zwei Arbeitsbereiche */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          className="animate-fade"
          style={{ animationDelay: "140ms" }}
        >
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold tracking-[var(--tracking-tight)] text-foreground">
                  Zuerst erledigen
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Nach Dringlichkeit sortiert.
                </p>
              </div>

              <Link
                href="/aufgaben"
                className="focus-ring inline-flex items-center gap-1 rounded text-sm font-semibold text-accent hover:gap-1.5"
              >
                Alle
                <Icon name="chevronRight" size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-5">
                    <span className="skeleton mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <span className="skeleton block h-4 w-1/2" />
                      <span className="skeleton block h-3 w-3/4" />
                      <span className="skeleton block h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name="check" size={22} />
                </div>
                <p className="mt-4 font-semibold text-foreground">
                  Alles erledigt
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Aktuell gibt es keine offenen Aufgaben.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="animate-rise group relative p-5 transition-colors duration-200 hover:bg-muted/40"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-transparent transition-all duration-300 group-hover:ring-current/5 ${getPriorityDot(
                          task.priority
                        )}`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-foreground">
                            {task.title}
                          </p>

                          <span className="rounded-[var(--radius-pill)] border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
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

        <section
          className="animate-fade"
          style={{ animationDelay: "180ms" }}
        >
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold tracking-[var(--tracking-tight)] text-foreground">
                  Stimmen der Mitglieder
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Die neuesten Rückmeldungen.
                </p>
              </div>

              <Link
                href="/feedback"
                className="focus-ring inline-flex items-center gap-1 rounded text-sm font-semibold text-accent hover:gap-1.5"
              >
                Alle
                <Icon name="chevronRight" size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="skeleton block h-4 w-24" />
                      <span className="skeleton block h-3 w-16" />
                    </div>
                    <span className="skeleton mt-3 block h-4 w-4/5" />
                    <span className="skeleton mt-3 block h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : recentFeedback.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name="feedback" size={22} />
                </div>
                <p className="mt-4 font-semibold text-foreground">
                  Noch kein Feedback
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Neue Rückmeldungen erscheinen hier.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentFeedback.map((feedback, index) => (
                  <div
                    key={feedback.id}
                    className="animate-rise p-5 transition-colors duration-200 hover:bg-muted/40"
                    style={{ animationDelay: `${index * 50}ms` }}
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

      {/* Jarvis – Premium-Banner mit Mini-Core */}
      <section
        className="animate-fade"
        style={{ animationDelay: "220ms" }}
      >
        <Card className="interactive group overflow-hidden">
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%)",
              }}
            />

            <div className="relative flex items-center gap-4">
              {/* Mini-Core */}
              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full opacity-70 blur-[6px]"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--accent) 45%, transparent), transparent 60%)",
                  }}
                />
                <span
                  className="absolute inset-0 animate-spin-slow rounded-full opacity-70"
                  style={{
                    background:
                      "conic-gradient(from 90deg, transparent, var(--accent), transparent 55%)",
                    WebkitMaskImage:
                      "radial-gradient(circle, transparent 56%, #000 58%)",
                    maskImage:
                      "radial-gradient(circle, transparent 56%, #000 58%)",
                  }}
                />
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-accent">
                  <Icon name="jarvis" size={18} />
                </span>
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold tracking-[var(--tracking-tight)] text-foreground">
                    Frag Jarvis
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-accent/20 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Bereit
                  </span>
                </div>

                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                  Deinen Assistenten nach Problemen, Feedbacks oder offenen Aufgaben fragen — mit sofortiger, kompakter Einschätzung.
                </p>
              </div>
            </div>

            <Link
              href="/jarvis"
              className="focus-ring interactive group/btn relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)] dark:bg-white dark:text-[#0a0b0d]"
            >
              Jarvis öffnen
              <Icon
                name="chevronRight"
                size={16}
                className="transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5"
              />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}