"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/format";
import { useTheme } from "@/components/providers/ThemeProvider";

type ApiLocation = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
};

type LocationsResponse = {
  ok: boolean;
  locations?: ApiLocation[];
  error?: string;
};

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "focus-ring relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-300",
        checked
          ? "border-accent bg-accent"
          : "border-border bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function EinstellungenPage() {
  const { theme, toggleTheme } = useTheme();

  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      setIsLoadingLocations(true);
      setLocationError("");

      try {
        const response = await fetch("/api/locations/list", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result = (await response.json()) as LocationsResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error || "Standorte konnten nicht geladen werden."
          );
        }

        setLocations(result.locations ?? []);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Settings location loading failed:", error);

        setLocationError(
          error instanceof Error
            ? error.message
            : "Standorte konnten nicht geladen werden."
        );

        setLocations([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingLocations(false);
        }
      }
    }

    void loadLocations();

    return () => {
      controller.abort();
    };
  }, []);

  const activeLocations = locations.filter(
    (location) => location.is_active
  );

  return (
    <div className="pb-8">
      <SectionHeading
        eyebrow="Konfiguration"
        title="Einstellungen"
        description="Darstellung, Standortverwaltung und Systeminformationen."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader
            title="Darstellung"
            subtitle="Passe die Oberfläche an deine Arbeitsweise an"
          />

          <CardBody className="divide-y divide-border pt-1">
            <SettingRow
              title="Dunkler Modus"
              description="Zwischen heller und dunkler Darstellung wechseln."
            >
              <div className="flex items-center gap-3">
                <Icon
                  name={theme === "dark" ? "moon" : "sun"}
                  size={17}
                  className="text-muted-foreground"
                />

                <Switch
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                  label="Dunklen Modus umschalten"
                />
              </div>
            </SettingRow>

            <SettingRow
              title="Sprache"
              description="Aktuell verwendete Oberflächensprache."
            >
              <span className="rounded-[var(--radius-pill)] border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                Deutsch
              </span>
            </SettingRow>

            <SettingRow
              title="Standard-Zeitraum"
              description="Vorauswahl für Dashboard-Auswertungen."
            >
              <span className="text-sm font-medium text-foreground">
                Letzte 30 Tage
              </span>
            </SettingRow>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Standorte"
            subtitle="Aktive Studios und operative Übersicht"
          />

          <CardBody>
            {locationError ? (
              <div className="rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                {locationError}
              </div>
            ) : (
              <>
                <div className="surface interactive rounded-[var(--radius-card)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-accent/20 bg-accent-soft text-accent">
                        <Icon name="location" size={20} />
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Aktive Standorte
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          In Prime Insight verwaltete Studios
                        </p>
                      </div>
                    </div>

                    <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
                      {isLoadingLocations ? (
                        <span className="skeleton inline-block h-8 w-8 align-middle" />
                      ) : (
                        activeLocations.length
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {isLoadingLocations ? (
                    <>
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-[var(--radius-card)] border border-border px-4 py-3"
                        >
                          <div className="space-y-2">
                            <span className="skeleton block h-4 w-32" />
                            <span className="skeleton block h-3 w-20" />
                          </div>
                          <span className="skeleton h-2.5 w-2.5 rounded-full" />
                        </div>
                      ))}
                    </>
                  ) : activeLocations.length === 0 ? (
                    <div className="surface rounded-[var(--radius-card)] px-4 py-6 text-center text-sm text-muted-foreground">
                      Keine aktiven Standorte gefunden.
                    </div>
                  ) : (
                    activeLocations.slice(0, 3).map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between rounded-[var(--radius-card)] border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {location.name}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {location.city || "Ort nicht hinterlegt"}
                          </p>
                        </div>

                        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping-slow rounded-full bg-accent/50" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/standorte"
                  className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-accent transition-all hover:gap-2.5"
                >
                  Standortübersicht öffnen
                  <Icon name="chevronRight" size={14} />
                </Link>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Produkt"
            subtitle="Informationen zu Prime Insight"
          />

          <CardBody className="divide-y divide-border pt-1">
            <SettingRow
              title="Produktname"
              description="Digitale Qualitäts- und Feedbackplattform."
            >
              <span className="text-sm font-semibold text-foreground">
                Prime Insight
              </span>
            </SettingRow>

            <SettingRow
              title="Unternehmen"
              description="Individuell für Fitness Level eingerichtet."
            >
              <span className="text-sm font-semibold text-foreground">
                Fitness Level
              </span>
            </SettingRow>

            <SettingRow
              title="Version"
              description="Aktueller Produktstand."
            >
              <span className="rounded-[var(--radius-pill)] border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                Version 1.0
              </span>
            </SettingRow>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Konto"
            subtitle="Sitzung und Zugriff verwalten"
          />

          <CardBody>
            <div className="surface rounded-[var(--radius-card)] p-5">
              <p className="text-sm font-semibold text-foreground">
                Aktive Sitzung
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Du bist aktuell angemeldet. Beim Abmelden wirst du zur
                Login-Seite weitergeleitet.
              </p>

              <form
                action="/api/auth/logout"
                method="post"
                className="mt-5"
              >
                <Button type="submit" variant="secondary">
                  Abmelden
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}